import { Test, TestingModule } from '@nestjs/testing';
import { NextFunction, Request, Response } from 'express';
import { TokenService } from '../token.service';
import { IdTokenMiddleware } from './id-token.middleware';

describe('IdTokenMiddleware', () => {
  let middleware: IdTokenMiddleware;
  let tokenService: TokenService;
  let mockRequest: Partial<Request>;
  const mockResponse = {} as Response;
  const mockNext: NextFunction = jest.fn();

  beforeEach(async () => {
    mockRequest = {
      cookies: {
        id_token: 'mock-id-token',
      },
    } as Partial<Request>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IdTokenMiddleware,
        {
          provide: TokenService,
          useValue: {
            extractToken: jest.fn(),
            verifyIdToken: jest.fn(),
          },
        },
      ],
    }).compile();

    middleware = module.get<IdTokenMiddleware>(IdTokenMiddleware);
    tokenService = module.get<TokenService>(TokenService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(middleware).toBeDefined();
  });

  it('should call next() regardless of token presence', async () => {
    jest.spyOn(tokenService, 'extractToken').mockReturnValue(undefined);

    await middleware.use(mockRequest as Request, mockResponse, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it('should set userId on request when valid token is present', async () => {
    const mockDecodedToken = {
      sub: 'user-123',
      email: 'test@example.com',
      token_use: 'id',
      aud: 'client-id',
      'cognito:username': 'username',
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
    };

    jest.spyOn(tokenService, 'extractToken').mockReturnValue('valid-token');
    (tokenService.verifyIdToken as jest.Mock).mockResolvedValue(mockDecodedToken);

    await middleware.use(mockRequest as Request, mockResponse, mockNext);

    expect(tokenService.extractToken).toHaveBeenCalledWith(mockRequest, 'id_token', false);
    expect(tokenService.verifyIdToken).toHaveBeenCalledWith('valid-token');
    expect(mockRequest.userId).toEqual(mockDecodedToken);
    expect(mockNext).toHaveBeenCalled();
  });

  it('should not set userId when token verification fails', async () => {
    jest.spyOn(tokenService, 'extractToken').mockReturnValue('invalid-token');
    (tokenService.verifyIdToken as jest.Mock).mockRejectedValue(new Error('Invalid token'));

    await middleware.use(mockRequest as Request, mockResponse, mockNext);

    expect(tokenService.extractToken).toHaveBeenCalledWith(mockRequest, 'id_token', false);
    expect(tokenService.verifyIdToken).toHaveBeenCalledWith('invalid-token');
    expect(mockRequest.userId).toBeUndefined();
    expect(mockNext).toHaveBeenCalled();
  });

  it('should not attempt to verify when no token is present', async () => {
    jest.spyOn(tokenService, 'extractToken').mockReturnValue(undefined);

    await middleware.use(mockRequest as Request, mockResponse, mockNext);

    expect(tokenService.extractToken).toHaveBeenCalledWith(mockRequest, 'id_token', false);
    expect(tokenService.verifyIdToken).not.toHaveBeenCalled();
    expect(mockRequest.userId).toBeUndefined();
    expect(mockNext).toHaveBeenCalled();
  });
});
