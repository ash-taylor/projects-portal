import { UserStatusType } from '@aws-sdk/client-cognito-identity-provider';
import { Test, TestingModule } from '@nestjs/testing';
import { Request, Response } from 'express';
import { UserResponseDto } from '../users/dtos/user-response.dto';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { DeleteUserDto } from './dtos/delete-user.dto';
import { MessageResponseDto } from './dtos/message-response.dto';
import { SignInDto } from './dtos/signin.dto';
import { SignupResponseDto } from './dtos/signup-response.dto';
import { SignupDto } from './dtos/signup.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { VerifyDto } from './dtos/verify.dto';
import { AuthStatus } from './models/auth-status.enum';
import { Role } from './models/role.enum';

// Mock the AuthGuard
jest.mock('./auth.guard', () => ({
  AuthGuard: jest.fn().mockImplementation(() => ({
    canActivate: jest.fn().mockReturnValue(true),
  })),
}));

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    signup: jest.fn(),
    verifyUser: jest.fn(),
    userSignIn: jest.fn(),
    refresh: jest.fn(),
    logout: jest.fn(),
    returnLoggedInUserInfo: jest.fn(),
    updateLoggedInUserInfo: jest.fn(),
    deleteLoggedInUser: jest.fn(),
    deleteUser: jest.fn(),
    getSecret: jest.fn(),
  };

  const mockResponse = {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  } as unknown as Response;

  const mockRequest = {
    cookies: {},
    headers: {},
    userId: {
      sub: 'test-sub',
      email: 'test@example.com',
    },
  } as unknown as Request;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('signup', () => {
    it('should call authService.signup with correct parameters', async () => {
      const signupDto: SignupDto = {
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
        admin: false,
      };

      const expectedResponse: SignupResponseDto = {
        status: AuthStatus.SUCCESS,
        message: 'User created successfully',
        userVerificationStatus: UserStatusType.UNCONFIRMED,
      };

      mockAuthService.signup.mockResolvedValue(expectedResponse);

      const result = await controller.signup(signupDto, mockResponse);

      expect(authService.signup).toHaveBeenCalledWith(signupDto, mockResponse);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('verify', () => {
    it('should call authService.verifyUser with correct parameters', async () => {
      const verifyDto: VerifyDto = {
        email: 'test@example.com',
        confirmationCode: '123456',
      };

      const expectedResponse: UserResponseDto = {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        active: true,
        userRoles: [Role.User],
      };

      mockAuthService.verifyUser.mockResolvedValue(expectedResponse);

      const result = await controller.verify(verifyDto, mockRequest, mockResponse);

      expect(authService.verifyUser).toHaveBeenCalledWith(verifyDto, mockRequest, mockResponse);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('signin', () => {
    it('should call authService.userSignIn with correct parameters', async () => {
      const signInDto: SignInDto = {
        email: 'test@example.com',
        password: 'Password123!',
      };

      const expectedResponse: UserResponseDto = {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        active: true,
        userRoles: [Role.User],
      };

      mockAuthService.userSignIn.mockResolvedValue(expectedResponse);

      const result = await controller.signin(signInDto, mockResponse);

      expect(authService.userSignIn).toHaveBeenCalledWith(signInDto, mockResponse);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('refresh', () => {
    it('should call authService.refresh with correct parameters', async () => {
      const expectedResponse: MessageResponseDto = {
        message: 'success',
      };

      mockAuthService.refresh.mockResolvedValue(expectedResponse);

      const result = await controller.refresh(mockRequest, mockResponse);

      expect(authService.refresh).toHaveBeenCalledWith(mockRequest, mockResponse);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('logout', () => {
    it('should call authService.logout with correct parameters', async () => {
      const expectedResponse: MessageResponseDto = {
        message: 'success',
      };

      mockAuthService.logout.mockResolvedValue(expectedResponse);

      const result = await controller.logout(mockRequest, mockResponse);

      expect(authService.logout).toHaveBeenCalledWith(mockRequest, mockResponse);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('me', () => {
    it('should call authService.returnLoggedInUserInfo with correct parameters', async () => {
      const expectedResponse: UserResponseDto = {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        active: true,
        userRoles: [Role.User],
      };

      mockAuthService.returnLoggedInUserInfo.mockResolvedValue(expectedResponse);

      const result = await controller.me(mockRequest);

      expect(authService.returnLoggedInUserInfo).toHaveBeenCalledWith(mockRequest);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('updateMe', () => {
    it('should call authService.updateLoggedInUserInfo with correct parameters', async () => {
      const updateUserDto: UpdateUserDto = {
        firstName: 'Updated',
        lastName: 'User',
      };

      const expectedResponse: UserResponseDto = {
        email: 'test@example.com',
        firstName: 'Updated',
        lastName: 'User',
        active: true,
        userRoles: [Role.User],
      };

      mockAuthService.updateLoggedInUserInfo.mockResolvedValue(expectedResponse);

      const result = await controller.updateMe(updateUserDto, mockRequest);

      expect(authService.updateLoggedInUserInfo).toHaveBeenCalledWith(updateUserDto, mockRequest);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('deleteMe', () => {
    it('should call authService.deleteLoggedInUser with correct parameters', async () => {
      const expectedResponse: UserResponseDto = {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        active: false,
        userRoles: [Role.User],
      };

      mockAuthService.deleteLoggedInUser.mockResolvedValue(expectedResponse);

      const result = await controller.deleteMe(mockRequest, mockResponse);

      expect(authService.deleteLoggedInUser).toHaveBeenCalledWith(mockRequest, mockResponse);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('deleteUser', () => {
    it('should call authService.deleteUser with correct parameters', async () => {
      const deleteUserDto: DeleteUserDto = {
        email: 'user-to-delete@example.com',
      };

      const expectedResponse: UserResponseDto = {
        email: 'user-to-delete@example.com',
        firstName: 'Delete',
        lastName: 'User',
        active: false,
        userRoles: [Role.User],
      };

      mockAuthService.deleteUser.mockResolvedValue(expectedResponse);

      const result = await controller.deleteUser(deleteUserDto, mockRequest);

      expect(authService.deleteUser).toHaveBeenCalledWith(deleteUserDto.email, mockRequest);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('getSecret', () => {
    it('should call authService.getSecret', async () => {
      const expectedResponse = { secret: 'test-secret' };

      mockAuthService.getSecret.mockResolvedValue(expectedResponse);

      const result = await controller.getSecret();

      expect(authService.getSecret).toHaveBeenCalled();
      expect(result).toEqual(expectedResponse);
    });
  });
});
