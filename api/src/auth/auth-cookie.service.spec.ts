import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
import { AuthCookieService } from './auth-cookie.service';

describe('AuthCookieService', () => {
  let service: AuthCookieService;
  let mockResponse: Partial<Response>;

  beforeEach(async () => {
    mockResponse = {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthCookieService,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn().mockImplementation((key) => {
              if (key === 'apiPrefix') return 'api';
              throw new Error(`Unexpected key: ${key}`);
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthCookieService>(AuthCookieService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('setHttpOnlyCookie', () => {
    it('should set a cookie with default options', async () => {
      await service.setHttpOnlyCookie('testCookie', 'testValue', mockResponse as Response);

      expect(mockResponse.cookie).toHaveBeenCalledWith('testCookie', 'testValue', {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/api',
      });
    });

    it('should set a cookie with custom options', async () => {
      await service.setHttpOnlyCookie('testCookie', 'testValue', mockResponse as Response, {
        maxAge: 3600000,
        domain: 'example.com',
      });

      expect(mockResponse.cookie).toHaveBeenCalledWith('testCookie', 'testValue', {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/api',
        maxAge: 3600000,
        domain: 'example.com',
      });
    });

    it('should format path correctly when provided in options', async () => {
      await service.setHttpOnlyCookie('testCookie', 'testValue', mockResponse as Response, {
        path: 'auth',
      });

      expect(mockResponse.cookie).toHaveBeenCalledWith('testCookie', 'testValue', {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/api/auth',
      });
    });

    it('should handle paths with leading or trailing slashes', async () => {
      await service.setHttpOnlyCookie('testCookie', 'testValue', mockResponse as Response, {
        path: '/auth/',
      });

      expect(mockResponse.cookie).toHaveBeenCalledWith('testCookie', 'testValue', {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/api/auth',
      });
    });
  });

  describe('clearHttpOnlyCookie', () => {
    it('should clear a cookie with default options', async () => {
      await service.clearHttpOnlyCookie('testCookie', mockResponse as Response);

      expect(mockResponse.clearCookie).toHaveBeenCalledWith('testCookie', {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/api',
      });
    });

    it('should clear a cookie with custom options', async () => {
      await service.clearHttpOnlyCookie('testCookie', mockResponse as Response, {
        domain: 'example.com',
      });

      expect(mockResponse.clearCookie).toHaveBeenCalledWith('testCookie', {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/api',
        domain: 'example.com',
      });
    });

    it('should format path correctly when provided in options', async () => {
      await service.clearHttpOnlyCookie('testCookie', mockResponse as Response, {
        path: 'auth',
      });

      expect(mockResponse.clearCookie).toHaveBeenCalledWith('testCookie', {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/api/auth',
      });
    });

    it('should handle paths with leading or trailing slashes', async () => {
      await service.clearHttpOnlyCookie('testCookie', mockResponse as Response, {
        path: '/auth/',
      });

      expect(mockResponse.clearCookie).toHaveBeenCalledWith('testCookie', {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/api/auth',
      });
    });
  });
});
