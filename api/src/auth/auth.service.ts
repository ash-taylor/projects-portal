import { createHmac } from 'node:crypto';
import {
  AdminAddUserToGroupCommand,
  AdminGetUserCommand,
  AdminInitiateAuthCommand,
  AuthFlowType,
  CognitoIdentityProviderClient,
  ConfirmSignUpCommand,
  GetTokensFromRefreshTokenCommand,
  RevokeTokenCommand,
  SignUpCommand,
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
import { AuthCookieService } from './auth-cookie.service';
import { SignInDto } from './dtos/signin.dto';
import { SignupDto } from './dtos/signup.dto';
import { VerifyDto } from './dtos/verify.dto';
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

  async signup({ email, password, firstName, lastName, admin }: SignupDto) {
    this.log.log('Signing up new user');

    try {
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

      return {
        status: 'success',
        message: 'User created successfully',
        userVerificationStatus: response.UserConfirmed ? UserStatusType.CONFIRMED : UserStatusType.UNCONFIRMED,
      };
    } catch (error: unknown) {
      this.log.error(error);

      if ((error as Error)?.name === 'UsernameExistsException') {
        const user = await this.getUser(email);

        if (user.userStatus === UserStatusType.UNCONFIRMED)
          throw new ConflictException({
            status: 'pending_confirmation',
            message: 'User exists but not verified',
            userVerificationStatus: UserStatusType.UNCONFIRMED,
          });

        if (user.userStatus === UserStatusType.CONFIRMED)
          throw new ConflictException({
            status: 'already_exists',
            message: 'User already exists',
            userVerificationStatus: UserStatusType.CONFIRMED,
          });
      }

      throw new InternalServerErrorException('Error whilst signing up user');
    }
  }

  async userSignIn({ email, password }: SignInDto, res: Response): Promise<{ message: 'success' }> {
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

      return { message: 'success' };
    } catch (error: unknown) {
      this.log.error(error);

      if ((error as Error)?.name === 'UserNotFoundException') throw new UnauthorizedException();

      if ((error as Error)?.name === 'NotAuthorizedException') throw new UnauthorizedException();

      throw new InternalServerErrorException('Error whilst signing in user');
    }
  }

  async refresh(req: Request, res: Response) {
    this.log.log('Refreshing tokens');
    try {
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

  async verifyUser({ email, confirmationCode }: VerifyDto) {
    this.log.log('Verifying user');

    const command = new ConfirmSignUpCommand({
      ClientId: this.cognitoClientId,
      Username: email,
      ConfirmationCode: confirmationCode,
      ForceAliasCreation: true,
      SecretHash: this.generateSecretHash(email),
    });

    try {
      const response = await this.client.send(command);

      return {
        status: 'success',
        session: response.Session,
      };
    } catch (error: unknown) {
      this.log.error(error);

      if ((error as Error)?.name === 'CodeMismatchException') throw new BadRequestException({ status: 'invalid_code' });

      if ((error as Error)?.name === 'ExpiredCodeException') throw new BadRequestException({ status: 'expired_code' });

      throw new InternalServerErrorException('Error whilst verifying user');
    }
  }

  async logout(req: Request, res: Response) {
    this.log.log('Logging out user');

    try {
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

  async returnLoggedInUserInfo(req: Request) {
    const encodedIdToken = this.tokenService.extractToken(req, 'id_token', false);

    if (!encodedIdToken) throw new UnauthorizedException();

    const {
      email,
      given_name: firstName,
      family_name: lastName,
      'cognito:groups': roles,
    } = await this.tokenService.decodeJwt(encodedIdToken);

    return {
      email,
      firstName,
      lastName,
      roles,
    };
  }

  // To delete
  async getSecret(): Promise<Record<string, string>> {
    const secret = this.cognitoAppClientSecret;
    return { secret };
  }

  private async getUser(email: string) {
    this.log.log('Getting user');

    const command = new AdminGetUserCommand({
      UserPoolId: this.cognitoUserPoolId,
      Username: email,
    });

    try {
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
