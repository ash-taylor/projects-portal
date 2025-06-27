import { createHmac } from 'node:crypto';
import {
  AdminAddUserToGroupCommand,
  AdminDeleteUserCommand,
  AdminGetUserCommand,
  AdminInitiateAuthCommand,
  AdminUpdateUserAttributesCommand,
  AttributeType,
  AuthFlowType,
  ChallengeNameType,
  CognitoIdentityProviderClient,
  ConfirmSignUpCommand,
  GetTokensFromRefreshTokenCommand,
  RevokeTokenCommand,
  SignUpCommand,
  UserNotFoundException,
  UserStatusType,
} from '@aws-sdk/client-cognito-identity-provider';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { ApiHandlerConfig } from '../config/api-handler-config';
import { UserResponseDto } from '../users/dtos/user-response.dto';
import { UsersService } from '../users/users.service';
import { AuthCookieService } from './auth-cookie.service';
import { MessageResponseDto } from './dtos/message-response.dto';
import { SignInDto } from './dtos/signin.dto';
import { SignupResponseDto } from './dtos/signup-response.dto';
import { SignupDto } from './dtos/signup.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { VerifyDto } from './dtos/verify.dto';
import { AuthStatus } from './models/auth-status.enum';
import { Role } from './models/role.enum';
import { SecretsManagerService } from './secrets-manager.service';
import { TokenService } from './token.service';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly log = new Logger(AuthService.name);
  private readonly client = new CognitoIdentityProviderClient();

  private cognitoClientId: string;
  private cognitoUserPoolId: string;
  private cognitoAppClientSecretId: string;
  private cognitoAppClientSecret: string;

  constructor(
    private readonly configService: ConfigService<ApiHandlerConfig>,
    private readonly tokenService: TokenService,
    private readonly authCookieService: AuthCookieService,
    private readonly secretManagerService: SecretsManagerService,
    private readonly usersService: UsersService,
  ) {
    this.log.log('AuthService Initializing');

    this.cognitoClientId = this.configService.getOrThrow('cognitoClientId');
    this.cognitoUserPoolId = this.configService.getOrThrow('cognitoUserPoolId');
    this.cognitoAppClientSecretId = this.configService.getOrThrow('cognitoClientSecretName');
  }

  async onModuleInit() {
    this.log.log('Getting Cognito App Client Secret');
    this.cognitoAppClientSecret = await this.secretManagerService.getSecret(this.cognitoAppClientSecretId);
  }

  async signup({ email, password, firstName, lastName, admin }: SignupDto, res: Response): Promise<SignupResponseDto> {
    try {
      this.log.log('Signing up new user');

      const signupCommand = new SignUpCommand({
        ClientId: this.cognitoClientId,
        Username: email,
        Password: password,
        UserAttributes: [
          {
            Name: 'given_name',
            Value: firstName,
          },
          {
            Name: 'family_name',
            Value: lastName,
          },
        ],
        SecretHash: this.generateSecretHash(email),
      });

      const response = await this.client.send(signupCommand);

      if (!response.UserSub) throw new InternalServerErrorException('Error whilst signing up user');

      const groupCommands: AdminAddUserToGroupCommand[] = [
        new AdminAddUserToGroupCommand({ GroupName: Role.User, UserPoolId: this.cognitoUserPoolId, Username: email }),
      ];

      if (admin) {
        groupCommands.push(
          new AdminAddUserToGroupCommand({
            GroupName: Role.Admin,
            UserPoolId: this.cognitoUserPoolId,
            Username: email,
          }),
        );
      }

      for (let i = 0; i < groupCommands.length; i++) await this.client.send(groupCommands[i]);

      await this.usersService.createUser({
        sub: response.UserSub,
        email,
        firstName,
        lastName,
        active: false,
        roles: [Role.User, ...(admin ? [Role.Admin] : [])],
      });

      if (response.Session) {
        this.authCookieService.setHttpOnlyCookie('session', response.Session, res, { maxAge: 1000 * 60 * 60 }); // 1 hour
      }

      return {
        status: AuthStatus.SUCCESS,
        message: 'User created successfully',
        userVerificationStatus: response.UserConfirmed ? UserStatusType.CONFIRMED : UserStatusType.UNCONFIRMED,
      };
    } catch (error: unknown) {
      this.log.error(error);

      if ((error as Error)?.name === 'UsernameExistsException') {
        const user = await this.getUser(email);

        if (user.userStatus === UserStatusType.UNCONFIRMED)
          throw new ConflictException({
            status: AuthStatus.PENDING,
            message: 'User exists but not verified',
            userVerificationStatus: UserStatusType.UNCONFIRMED,
          });

        if (user.userStatus === UserStatusType.CONFIRMED)
          throw new ConflictException({
            status: AuthStatus.CONFLICT,
            message: 'User already exists',
            userVerificationStatus: UserStatusType.CONFIRMED,
          });

        if (error instanceof InternalServerErrorException) {
          await this.client.send(
            new AdminDeleteUserCommand({
              UserPoolId: this.cognitoUserPoolId,
              Username: email,
            }),
          );

          throw new InternalServerErrorException('Error whilst signing up user');
        }
      }

      throw new InternalServerErrorException('');
    }
  }

  async userSignIn({ email, password }: SignInDto, res: Response): Promise<UserResponseDto> {
    this.log.log('Signing in user');

    try {
      const command = new AdminInitiateAuthCommand({
        ClientId: this.cognitoClientId,
        UserPoolId: this.cognitoUserPoolId,
        AuthFlow: AuthFlowType.ADMIN_USER_PASSWORD_AUTH,
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password,
          SECRET_HASH: this.generateSecretHash(email),
        },
      });

      const response = await this.client.send(command);

      if (
        !response.AuthenticationResult?.AccessToken ||
        !response.AuthenticationResult?.IdToken ||
        !response.AuthenticationResult?.RefreshToken
      )
        throw new UnauthorizedException();

      const { AccessToken, IdToken, RefreshToken } = response.AuthenticationResult;

      this.authCookieService.setHttpOnlyCookie('access_token', AccessToken, res, { maxAge: 1000 * 60 * 5 }); // 5 minutes
      this.authCookieService.setHttpOnlyCookie('id_token', IdToken, res, { maxAge: 1000 * 60 * 60 }); // 1 hour
      this.authCookieService.setHttpOnlyCookie('refresh_token', RefreshToken, res, {
        maxAge: 1000 * 60 * 60 * 24,
        path: 'auth',
      }); // 1 Day

      return await this.usersService.getUser(email);
    } catch (error: unknown) {
      if ((error as Error)?.name === 'UserNotFoundException') throw new UnauthorizedException();

      if ((error as Error)?.name === 'NotAuthorizedException') throw new UnauthorizedException();

      throw new InternalServerErrorException('Error whilst signing in user');
    }
  }

  async refresh(req: Request, res: Response): Promise<MessageResponseDto> {
    try {
      this.log.log('Refreshing tokens');

      const encodedRefreshToken = this.tokenService.extractToken(req, 'refresh_token', false);
      const encodedIdToken = this.tokenService.extractToken(req, 'id_token', false);

      const { sub } = encodedIdToken ? await this.tokenService.decodeJwt(encodedIdToken) : { sub: null };

      if (!encodedRefreshToken || !sub) throw new UnauthorizedException();

      const command = new GetTokensFromRefreshTokenCommand({
        ClientId: this.cognitoClientId,
        ClientSecret: this.cognitoAppClientSecret,
        RefreshToken: encodedRefreshToken,
      });

      const response = await this.client.send(command);

      if (
        !response.AuthenticationResult?.AccessToken ||
        !response.AuthenticationResult?.IdToken ||
        !response.AuthenticationResult?.RefreshToken
      )
        throw new UnauthorizedException();

      const { AccessToken, IdToken, RefreshToken } = response.AuthenticationResult;

      this.authCookieService.setHttpOnlyCookie('access_token', AccessToken, res, { maxAge: 1000 * 60 * 5 }); // 5 minutes
      this.authCookieService.setHttpOnlyCookie('id_token', IdToken, res, { maxAge: 1000 * 60 * 60 }); // 1 hour
      this.authCookieService.setHttpOnlyCookie('refresh_token', RefreshToken, res, {
        maxAge: 1000 * 60 * 60 * 24,
        path: 'auth',
      }); // 1 Day

      return { message: 'success' };
    } catch (error) {
      this.log.error(error);

      throw new UnauthorizedException();
    }
  }

  async verifyUser({ email, confirmationCode }: VerifyDto, req: Request, res: Response): Promise<UserResponseDto> {
    try {
      this.log.log('Verifying user');

      const session = this.tokenService.extractToken(req, 'session', false);

      const verifyResponse = await this.client.send(
        new ConfirmSignUpCommand({
          ClientId: this.cognitoClientId,
          Username: email,
          ConfirmationCode: confirmationCode,
          ForceAliasCreation: true,
          SecretHash: this.generateSecretHash(email),
          Session: session,
        }),
      );

      if (!session) {
        await this.usersService.verifyUser(email);
        return await this.usersService.getUser(email);
      }

      const command = new AdminInitiateAuthCommand({
        ClientId: this.cognitoClientId,
        UserPoolId: this.cognitoUserPoolId,
        AuthFlow: 'USER_AUTH',
        AuthParameters: {
          USERNAME: email,
          EMAIL_OTP: confirmationCode,
          SECRET_HASH: this.generateSecretHash(email),
          PREFERRED_CHALLENGE: ChallengeNameType.EMAIL_OTP,
        },
        Session: verifyResponse.Session,
      });

      const response = await this.client.send(command);

      if (
        !response.AuthenticationResult?.AccessToken ||
        !response.AuthenticationResult?.IdToken ||
        !response.AuthenticationResult?.RefreshToken
      )
        throw new UnauthorizedException();

      const { AccessToken, IdToken, RefreshToken } = response.AuthenticationResult;

      this.authCookieService.setHttpOnlyCookie('access_token', AccessToken, res, { maxAge: 1000 * 60 * 5 }); // 5 minutes
      this.authCookieService.setHttpOnlyCookie('id_token', IdToken, res, { maxAge: 1000 * 60 * 60 }); // 1 hour
      this.authCookieService.setHttpOnlyCookie('refresh_token', RefreshToken, res, {
        maxAge: 1000 * 60 * 60 * 24,
        path: 'auth',
      }); // 1 Day

      await this.usersService.verifyUser(email);

      return await this.usersService.getUser(email);
    } catch (error: unknown) {
      this.log.error(error);

      if ((error as Error)?.name === 'CodeMismatchException') throw new BadRequestException({ status: 'invalid_code' });

      if ((error as Error)?.name === 'ExpiredCodeException') throw new BadRequestException({ status: 'expired_code' });

      throw new InternalServerErrorException('Error whilst verifying user');
    }
  }

  async updateUser(email: string, dto: UpdateUserDto): Promise<UserResponseDto> {
    try {
      this.log.log('Updating user');

      const UserAttributes: AttributeType[] = [];
      if (dto.firstName) UserAttributes.push({ Name: 'given_name', Value: dto.firstName });
      if (dto.lastName) UserAttributes.push({ Name: 'family_name', Value: dto.lastName });
      if (dto.email)
        UserAttributes.push(
          ...[
            { Name: 'email', Value: dto.email },
            { Name: 'email_verified', Value: 'true' },
          ],
        );

      if (UserAttributes.length) {
        const command = new AdminUpdateUserAttributesCommand({
          UserPoolId: this.cognitoUserPoolId,
          Username: email,
          UserAttributes,
        });

        this.log.log('Updating cognito user');
        await this.client.send(command);
      }

      this.log.log('Updating user in database');
      return await this.usersService.updateUser(dto, email);
    } catch (error) {
      this.log.error(error);

      throw new InternalServerErrorException('Error whilst updating user');
    }
  }

  async updateLoggedInUserInfo(dto: UpdateUserDto, req: Request) {
    try {
      this.log.log('Updating logged in user info');

      const sub = req.userId?.sub;
      if (!sub) throw new UnauthorizedException();

      const UserAttributes: AttributeType[] = [];
      if (dto.firstName) UserAttributes.push({ Name: 'given_name', Value: dto.firstName });
      if (dto.lastName) UserAttributes.push({ Name: 'family_name', Value: dto.lastName });
      if (dto.email)
        UserAttributes.push(
          ...[
            { Name: 'email', Value: dto.email },
            { Name: 'email_verified', Value: 'true' },
          ],
        );

      const command = new AdminUpdateUserAttributesCommand({
        UserPoolId: this.cognitoUserPoolId,
        Username: sub,
        UserAttributes,
      });

      this.log.log('Updating cognito user');
      await this.client.send(command);

      this.log.log('Updating user in database');
      return await this.usersService.updateUser(dto, sub);
    } catch (error) {
      this.log.error(error);

      if (error instanceof UserNotFoundException) throw new UnauthorizedException();
      if (error instanceof UnauthorizedException) throw error;

      throw new InternalServerErrorException('Error whilst updating user');
    }
  }

  async deleteUser(email: string, req: Request) {
    try {
      const user = req.userId;

      if (!user) throw new UnauthorizedException();
      if (email === user.email) throw new BadRequestException('Cannot delete logged in user');

      this.log.log('Deleting user');

      await this.client.send(
        new AdminDeleteUserCommand({
          UserPoolId: this.cognitoUserPoolId,
          Username: email,
        }),
      );

      return await this.usersService.deleteUser(email);
    } catch (error) {
      this.log.error(error);

      if (error instanceof UserNotFoundException) {
        // Edge case in which user does not exist in cognito but still resides in the DB
        this.log.log('User does not exist in cognito, deleting user from DB');
        return await this.usersService.deleteUser(email);
      }

      if (error instanceof BadRequestException) throw error;

      throw new InternalServerErrorException('Error whilst deleting user');
    }
  }

  async deleteLoggedInUser(req: Request, res: Response) {
    try {
      this.log.log('Deleting logged in user');

      const sub = req.userId?.sub;

      if (!sub) throw new UnauthorizedException();

      await this.client.send(
        new AdminDeleteUserCommand({
          UserPoolId: this.cognitoUserPoolId,
          Username: sub,
        }),
      );

      this.authCookieService.clearHttpOnlyCookie('access_token', res, { maxAge: 1000 * 60 * 5 });
      this.authCookieService.clearHttpOnlyCookie('id_token', res, { maxAge: 1000 * 60 * 60 });
      this.authCookieService.clearHttpOnlyCookie('refresh_token', res, {
        maxAge: 1000 * 60 * 60 * 24,
        path: 'auth',
      });

      return await this.usersService.deleteUser(sub);
    } catch (error) {
      this.log.error(error);

      throw new InternalServerErrorException('Error whilst deleting user');
    }
  }

  async logout(req: Request, res: Response): Promise<MessageResponseDto> {
    try {
      this.log.log('Logging out user');

      const encodedRefreshToken = this.tokenService.extractToken(req, 'refresh_token', false);

      await this.client.send(
        new RevokeTokenCommand({
          ClientId: this.cognitoClientId,
          Token: encodedRefreshToken,
          ClientSecret: this.cognitoAppClientSecret,
        }),
      );

      this.authCookieService.clearHttpOnlyCookie('access_token', res, { maxAge: 1000 * 60 * 5 });
      this.authCookieService.clearHttpOnlyCookie('id_token', res, { maxAge: 1000 * 60 * 60 });
      this.authCookieService.clearHttpOnlyCookie('refresh_token', res, {
        maxAge: 1000 * 60 * 60 * 24,
        path: 'auth',
      });

      return { message: 'success' };
    } catch (error) {
      this.log.error;

      throw new InternalServerErrorException('Error whilst logging out user');
    }
  }

  async returnLoggedInUserInfo(req: Request): Promise<UserResponseDto> {
    const encodedIdToken = this.tokenService.extractToken(req, 'id_token', false);

    if (!encodedIdToken) throw new UnauthorizedException();

    const { email } = await this.tokenService.decodeJwt(encodedIdToken);

    return await this.usersService.getUser(email);
  }

  private async getUser(email: string) {
    try {
      this.log.log('Getting user');

      const command = new AdminGetUserCommand({
        UserPoolId: this.cognitoUserPoolId,
        Username: email,
      });

      const result = await this.client.send(command);

      return {
        username: result.Username,
        userStatus: result.UserStatus,
        userAttributes: result.UserAttributes,
        enabled: result.Enabled,
      };
    } catch (error) {
      this.log.error(error);

      throw error;
    }
  }

  private generateSecretHash(username: string) {
    const hasher = createHmac('sha256', this.cognitoAppClientSecret);

    hasher.update(`${username}${this.cognitoClientId}`);
    return hasher.digest('base64');
  }
}
