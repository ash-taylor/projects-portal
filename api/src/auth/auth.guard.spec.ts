import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthGuard } from './auth.guard';
import { Role } from './models/role.enum';
import { TokenService } from './token.service';

describe('AuthGuard', () => {
  let guard: AuthGuard;

  const mockTokenService = {
    extractTokenFromHeader: jest.fn(),
    verifyAccessToken: jest.fn(),
  };

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuard,
        {
          provide: TokenService,
          useValue: mockTokenService,
        },
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    guard = module.get<AuthGuard>(AuthGuard);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true when token is valid and user has required role', async () => {
      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            headers: { authorization: 'Bearer token' },
          }),
        }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;

      mockReflector.getAllAndOverride.mockReturnValue([Role.User]);
      mockTokenService.extractTokenFromHeader.mockReturnValue('valid-token');
      mockTokenService.verifyAccessToken.mockResolvedValue({
        'cognito:groups': [Role.User],
      });

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(mockTokenService.extractTokenFromHeader).toHaveBeenCalled();
      expect(mockTokenService.verifyAccessToken).toHaveBeenCalledWith('valid-token');
    });

    it('should throw UnauthorizedException when no token is provided', async () => {
      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            headers: {},
          }),
        }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;

      mockTokenService.extractTokenFromHeader.mockReturnValue(undefined);

      await expect(guard.canActivate(mockContext)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when token verification fails', async () => {
      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            headers: { authorization: 'Bearer token' },
          }),
        }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;

      mockTokenService.extractTokenFromHeader.mockReturnValue('invalid-token');
      mockTokenService.verifyAccessToken.mockRejectedValue(new UnauthorizedException());

      await expect(guard.canActivate(mockContext)).rejects.toThrow(UnauthorizedException);
    });

    it('should return false when user does not have required role', async () => {
      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            headers: { access_token: 'Access token' },
          }),
        }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;

      mockReflector.getAllAndOverride.mockReturnValue([Role.Admin]);
      mockTokenService.extractTokenFromHeader.mockReturnValue('valid-token');
      mockTokenService.verifyAccessToken.mockResolvedValue({
        'cognito:groups': [Role.User],
      });

      await expect(guard.canActivate(mockContext)).resolves.toBe(false);
    });

    it('should return true when no roles are required', async () => {
      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            headers: { authorization: 'Bearer token' },
          }),
        }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;

      mockReflector.getAllAndOverride.mockReturnValue(undefined);
      mockTokenService.extractTokenFromHeader.mockReturnValue('valid-token');
      mockTokenService.verifyAccessToken.mockResolvedValue({
        'cognito:groups': [Role.User],
      });

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
    });
  });
});
