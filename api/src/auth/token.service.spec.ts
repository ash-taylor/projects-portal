import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import * as awsJwtVerify from 'aws-jwt-verify';
import { TokenService } from './token.service';

jest.mock('aws-jwt-verify', () => ({
  CognitoJwtVerifier: {
    create: jest.fn().mockReturnValue({
      verify: jest.fn(),
    }),
  },
}));

describe('TokenService', () => {
  let service: TokenService;

  const mockConfigService = {
    getOrThrow: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockConfigService.getOrThrow.mockImplementation((key) => {
      if (key === 'cognitoClientId') return 'test-client-id';
      if (key === 'cognitoUserPoolId') return 'test-user-pool-id';
      return undefined;
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<TokenService>(TokenService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should initialize the token verifiers', () => {
      service.onModuleInit();

      expect(awsJwtVerify.CognitoJwtVerifier.create).toHaveBeenCalledTimes(2);
      expect(awsJwtVerify.CognitoJwtVerifier.create).toHaveBeenCalledWith({
        userPoolId: 'test-user-pool-id',
        tokenUse: 'access',
        clientId: 'test-client-id',
      });
      expect(awsJwtVerify.CognitoJwtVerifier.create).toHaveBeenCalledWith({
        userPoolId: 'test-user-pool-id',
        tokenUse: 'id',
        clientId: 'test-client-id',
      });
    });
  });

  describe('verifyAccessToken', () => {
    it('should call the access token verifier', async () => {
      const mockVerify = jest.fn().mockResolvedValue({ sub: 'test-sub' });
      (awsJwtVerify.CognitoJwtVerifier.create as jest.Mock).mockReturnValue({
        verify: mockVerify,
      });

      service.onModuleInit();
      await service.verifyAccessToken('test-token');

      expect(mockVerify).toHaveBeenCalledWith('test-token');
    });

    it('should throw an error if verification fails', async () => {
      const mockVerify = jest.fn().mockRejectedValue(new Error('Invalid token'));
      (awsJwtVerify.CognitoJwtVerifier.create as jest.Mock).mockReturnValue({
        verify: mockVerify,
      });

      service.onModuleInit();
      await expect(service.verifyAccessToken('invalid-token')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('verifyIdToken', () => {
    it('should call the id token verifier', async () => {
      const mockVerify = jest.fn().mockResolvedValue({ sub: 'test-sub' });
      (awsJwtVerify.CognitoJwtVerifier.create as jest.Mock).mockReturnValue({
        verify: mockVerify,
      });

      service.onModuleInit();
      await service.verifyIdToken('test-token');

      expect(mockVerify).toHaveBeenCalledWith('test-token');
    });

    it('should throw an error if verification fails', async () => {
      const mockVerify = jest.fn().mockRejectedValue(new Error('Invalid token'));
      (awsJwtVerify.CognitoJwtVerifier.create as jest.Mock).mockReturnValue({
        verify: mockVerify,
      });

      service.onModuleInit();
      await expect(service.verifyIdToken('invalid-token')).rejects.toThrow('Invalid token');
    });
  });

  describe('decodeJwt', () => {
    it('should decode a valid JWT token', () => {
      // Sample JWT with payload { "sub": "test-user", "name": "Test User" }
      const token =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXIiLCJuYW1lIjoiVGVzdCBVc2VyIn0.KxByF3yAqJPE6GbHeDGXbUjCFBJ-vxYl-PVG5qBKwmg';

      const result = service.decodeJwt(token);

      expect(result).toEqual({
        sub: 'test-user',
        name: 'Test User',
      });
    });

    it('should throw an error for an invalid JWT', () => {
      expect(() => service.decodeJwt('invalid-token')).toThrow('Invalid JWT');
    });
  });

  describe('extractTokenFromHeader', () => {
    it('should extract token from authorization header', () => {
      const request = {
        headers: {
          authorization: 'Bearer test-token',
        },
        cookies: {},
      };

      // biome-ignore lint/suspicious/noExplicitAny:
      const result = service.extractTokenFromHeader(request as any);

      expect(result).toBe('test-token');
    });

    it('should return undefined if no authorization header', () => {
      const request = {
        headers: {},
        cookies: {},
      };

      // biome-ignore lint/suspicious/noExplicitAny:
      const result = service.extractTokenFromHeader(request as any);

      expect(result).toBeUndefined();
    });
  });

  describe('extractToken', () => {
    it('should extract token from cookies', () => {
      const request = {
        headers: {},
        cookies: {
          access_token: 'cookie-token',
        },
      };

      // biome-ignore lint/suspicious/noExplicitAny:
      const result = service.extractToken(request as any, 'access_token');

      expect(result).toBe('cookie-token');
    });

    it('should extract token from authorization header if not in cookies', () => {
      const request = {
        headers: {
          authorization: 'Bearer header-token',
        },
        cookies: {},
      };

      // biome-ignore lint/suspicious/noExplicitAny:
      const result = service.extractToken(request as any, 'access_token');

      expect(result).toBe('header-token');
    });

    it('should not check authorization header if checkAuthHeader is false', () => {
      const request = {
        headers: {
          authorization: 'Bearer header-token',
        },
        cookies: {},
      };

      // biome-ignore lint/suspicious/noExplicitAny:
      const result = service.extractToken(request as any, 'access_token', false);

      expect(result).toBeUndefined();
    });
  });
});
