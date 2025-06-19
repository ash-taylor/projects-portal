import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Request, Response } from 'express';
import { UsersService } from '../users/users.service';
import { AuthCookieService } from './auth-cookie.service';
import { AuthService } from './auth.service';
import { SignInDto } from './dtos/signin.dto';
import { SignupDto } from './dtos/signup.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { AuthStatus } from './models/auth-status.enum';
import { Role } from './models/role.enum';
import { SecretsManagerService } from './secrets-manager.service';
import { TokenService } from './token.service';

jest.mock('@aws-sdk/client-cognito-identity-provider', () => {
  return {
    CognitoIdentityProviderClient: jest.fn().mockImplementation(() => ({
      send: jest.fn(),
    })),
    SignUpCommand: jest.fn(),
    AdminAddUserToGroupCommand: jest.fn(),
    AdminInitiateAuthCommand: jest.fn(),
    ConfirmSignUpCommand: jest.fn(),
    AdminUpdateUserAttributesCommand: jest.fn(),
    AdminDeleteUserCommand: jest.fn(),
    RevokeTokenCommand: jest.fn(),
    AdminGetUserCommand: jest.fn(),
    GetTokensFromRefreshTokenCommand: jest.fn(),
    AuthFlowType: {
      ADMIN_USER_PASSWORD_AUTH: 'ADMIN_USER_PASSWORD_AUTH',
    },
    ChallengeNameType: {
      EMAIL_OTP: 'EMAIL_OTP',
    },
    UserStatusType: {
      CONFIRMED: 'CONFIRMED',
      UNCONFIRMED: 'UNCONFIRMED',
    },
    UserNotFoundException: class UserNotFoundException extends Error {
      constructor() {
        super('User not found');
        this.name = 'UserNotFoundException';
      }
    },
  };
});

describe('AuthService', () => {
  let service: AuthService;
  let tokenService: TokenService;
  let authCookieService: AuthCookieService;
  let usersService: UsersService;
  let mockCognitoClient: { send: jest.Mock };

  const mockRequest = {
    cookies: {
      access_token: 'mock-access-token',
      id_token: 'mock-id-token',
      refresh_token: 'mock-refresh-token',
      session: 'mock-session',
    },
    userId: {
      sub: 'mock-sub',
      email: 'test@example.com',
    },
  } as unknown as Request;

  const mockResponse = {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  } as unknown as Response;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn().mockImplementation((key) => {
              switch (key) {
                case 'cognitoClientId':
                  return 'mock-client-id';
                case 'cognitoUserPoolId':
                  return 'mock-user-pool-id';
                case 'cognitoClientSecretName':
                  return 'mock-client-secret-name';
                default:
                  throw new Error(`Unexpected key: ${key}`);
              }
            }),
          },
        },
        {
          provide: TokenService,
          useValue: {
            extractToken: jest.fn().mockReturnValue('mock-token'),
            decodeJwt: jest.fn().mockResolvedValue({
              sub: 'mock-sub',
              email: 'test@example.com',
            }),
            verifyAccessToken: jest.fn().mockResolvedValue({
              sub: 'mock-sub',
              email: 'test@example.com',
            }),
            verifyIdToken: jest.fn().mockResolvedValue({
              sub: 'mock-sub',
              email: 'test@example.com',
            }),
          },
        },
        {
          provide: AuthCookieService,
          useValue: {
            setHttpOnlyCookie: jest.fn(),
            clearHttpOnlyCookie: jest.fn(),
          },
        },
        {
          provide: SecretsManagerService,
          useValue: {
            getSecret: jest.fn().mockResolvedValue('mock-client-secret'),
          },
        },
        {
          provide: UsersService,
          useValue: {
            createUser: jest.fn().mockResolvedValue({
              firstName: 'Test',
              lastName: 'User',
              email: 'test@example.com',
              userRoles: [Role.User],
              active: true,
            }),
            verifyUser: jest.fn().mockResolvedValue({
              firstName: 'Test',
              lastName: 'User',
              email: 'test@example.com',
              userRoles: [Role.User],
              active: true,
            }),
            getUser: jest.fn().mockResolvedValue({
              firstName: 'Test',
              lastName: 'User',
              email: 'test@example.com',
              userRoles: [Role.User],
              active: true,
            }),
            updateUser: jest.fn().mockResolvedValue({
              firstName: 'Updated',
              lastName: 'User',
              email: 'test@example.com',
              userRoles: [Role.User],
              active: true,
            }),
            deleteUser: jest.fn().mockResolvedValue({
              firstName: 'Test',
              lastName: 'User',
              email: 'test@example.com',
              userRoles: [Role.User],
              active: false,
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    tokenService = module.get<TokenService>(TokenService);
    authCookieService = module.get<AuthCookieService>(AuthCookieService);
    usersService = module.get<UsersService>(UsersService);

    // Mock Cognito
    mockCognitoClient = {
      send: jest.fn(),
    };
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    (service as any).client = mockCognitoClient;
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    (service as any).cognitoAppClientSecret = 'mock-client-secret';

    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    (service as any).getUser = jest.fn().mockResolvedValue({
      username: 'test@example.com',
      userStatus: 'CONFIRMED',
      userAttributes: [],
      enabled: true,
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('signup', () => {
    it('should sign up a new user successfully', async () => {
      const signupDto: SignupDto = {
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
        admin: false,
      };

      mockCognitoClient.send.mockResolvedValueOnce({
        UserSub: 'mock-sub',
        UserConfirmed: false,
        Session: 'mock-session',
      });

      const result = await service.signup(signupDto, mockResponse);

      expect(result).toEqual({
        status: AuthStatus.SUCCESS,
        message: 'User created successfully',
        userVerificationStatus: 'UNCONFIRMED',
      });
      expect(usersService.createUser).toHaveBeenCalledWith({
        sub: 'mock-sub',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        active: false,
        roles: [Role.User],
      });
      expect(authCookieService.setHttpOnlyCookie).toHaveBeenCalledWith('session', 'mock-session', mockResponse, {
        maxAge: 3600000,
      });
    });
  });

  describe('userSignIn', () => {
    it('should sign in a user successfully', async () => {
      const signInDto: SignInDto = {
        email: 'test@example.com',
        password: 'Password123!',
      };

      mockCognitoClient.send.mockResolvedValueOnce({
        AuthenticationResult: {
          AccessToken: 'mock-access-token',
          IdToken: 'mock-id-token',
          RefreshToken: 'mock-refresh-token',
        },
      });

      await service.userSignIn(signInDto, mockResponse);

      expect(authCookieService.setHttpOnlyCookie).toHaveBeenCalledWith(
        'access_token',
        'mock-access-token',
        mockResponse,
        { maxAge: 300000 },
      );
      expect(authCookieService.setHttpOnlyCookie).toHaveBeenCalledWith('id_token', 'mock-id-token', mockResponse, {
        maxAge: 3600000,
      });
      expect(authCookieService.setHttpOnlyCookie).toHaveBeenCalledWith(
        'refresh_token',
        'mock-refresh-token',
        mockResponse,
        { maxAge: 86400000, path: 'auth' },
      );
      expect(usersService.getUser).toHaveBeenCalledWith('test@example.com');
    });

    it('should throw UnauthorizedException when authentication fails', async () => {
      const signInDto: SignInDto = {
        email: 'test@example.com',
        password: 'WrongPassword',
      };

      const error = new Error('Not authorized');
      error.name = 'NotAuthorizedException';
      mockCognitoClient.send.mockRejectedValueOnce(error);

      await expect(service.userSignIn(signInDto, mockResponse)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    it('should refresh tokens successfully', async () => {
      mockCognitoClient.send.mockResolvedValueOnce({
        AuthenticationResult: {
          AccessToken: 'new-access-token',
          IdToken: 'new-id-token',
          RefreshToken: 'new-refresh-token',
        },
      });

      const result = await service.refresh(mockRequest, mockResponse);

      expect(result).toEqual({ message: 'success' });
      expect(authCookieService.setHttpOnlyCookie).toHaveBeenCalledWith(
        'access_token',
        'new-access-token',
        mockResponse,
        { maxAge: 300000 },
      );
    });
  });

  describe('updateUser', () => {
    it('should update a user successfully', async () => {
      const updateDto: UpdateUserDto = {
        firstName: 'Updated',
        lastName: 'User',
      };

      mockCognitoClient.send.mockResolvedValueOnce({});

      const result = await service.updateUser('test@example.com', updateDto);

      expect(mockCognitoClient.send).toHaveBeenCalled();
      expect(usersService.updateUser).toHaveBeenCalledWith(updateDto, 'test@example.com');
      expect(result).toEqual({
        firstName: 'Updated',
        lastName: 'User',
        email: 'test@example.com',
        userRoles: [Role.User],
        active: true,
      });
    });
  });

  describe('updateLoggedInUserInfo', () => {
    it('should update logged in user info successfully', async () => {
      const updateDto: UpdateUserDto = {
        firstName: 'Updated',
        lastName: 'User',
      };

      mockCognitoClient.send.mockResolvedValueOnce({});

      const result = await service.updateLoggedInUserInfo(updateDto, mockRequest);

      expect(mockCognitoClient.send).toHaveBeenCalled();
      expect(usersService.updateUser).toHaveBeenCalledWith(updateDto, 'mock-sub');
      expect(result).toEqual({
        firstName: 'Updated',
        lastName: 'User',
        email: 'test@example.com',
        userRoles: [Role.User],
        active: true,
      });
    });

    it('should throw UnauthorizedException when user is not logged in', async () => {
      const updateDto: UpdateUserDto = {
        firstName: 'Updated',
        lastName: 'User',
      };

      await expect(
        service.updateLoggedInUserInfo(updateDto, { userId: { sub: undefined } } as unknown as Request),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('deleteUser', () => {
    it('should delete a user successfully', async () => {
      mockCognitoClient.send.mockResolvedValueOnce({});

      const result = await service.deleteUser('other@example.com', mockRequest);

      expect(mockCognitoClient.send).toHaveBeenCalled();
      expect(usersService.deleteUser).toHaveBeenCalledWith('other@example.com');
      expect(result).toEqual({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        userRoles: [Role.User],
        active: false,
      });
    });

    it('should throw BadRequestException when trying to delete logged in user', async () => {
      await expect(service.deleteUser('test@example.com', mockRequest)).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteLoggedInUser', () => {
    it('should delete logged in user successfully', async () => {
      mockCognitoClient.send.mockResolvedValueOnce({});

      const result = await service.deleteLoggedInUser(mockRequest, mockResponse);

      expect(mockCognitoClient.send).toHaveBeenCalled();
      expect(usersService.deleteUser).toHaveBeenCalledWith('mock-sub');
      expect(authCookieService.clearHttpOnlyCookie).toHaveBeenCalledWith('access_token', mockResponse, {
        maxAge: 300000,
      });
      expect(result).toEqual({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        userRoles: [Role.User],
        active: false,
      });
    });
  });

  describe('logout', () => {
    it('should logout a user successfully', async () => {
      mockCognitoClient.send.mockResolvedValueOnce({});

      const result = await service.logout(mockRequest, mockResponse);

      expect(result).toEqual({ message: 'success' });
      expect(authCookieService.clearHttpOnlyCookie).toHaveBeenCalledWith('access_token', mockResponse, {
        maxAge: 300000,
      });
      expect(authCookieService.clearHttpOnlyCookie).toHaveBeenCalledWith('id_token', mockResponse, { maxAge: 3600000 });
      expect(authCookieService.clearHttpOnlyCookie).toHaveBeenCalledWith('refresh_token', mockResponse, {
        maxAge: 86400000,
        path: 'auth',
      });
    });
  });

  describe('returnLoggedInUserInfo', () => {
    it('should return logged in user info', async () => {
      const result = await service.returnLoggedInUserInfo(mockRequest);

      expect(tokenService.extractToken).toHaveBeenCalledWith(mockRequest, 'id_token', false);
      expect(tokenService.decodeJwt).toHaveBeenCalledWith('mock-token');
      expect(usersService.getUser).toHaveBeenCalledWith('test@example.com');
      expect(result).toEqual({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        userRoles: [Role.User],
        active: true,
      });
    });
  });
});
