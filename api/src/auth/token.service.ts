import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { CognitoJwtVerifierSingleUserPool } from 'aws-jwt-verify/cognito-verifier';
import { Request } from 'express';
import { ApiHandlerConfig } from '../config/api-handler-config';

@Injectable()
export class TokenService implements OnModuleInit {
  private readonly log = new Logger(TokenService.name);
  private accessTokenVerifier: CognitoJwtVerifierSingleUserPool<{
    userPoolId: string;
    tokenUse: 'access';
    clientId: string;
  }>;
  private idTokenVerifier: CognitoJwtVerifierSingleUserPool<{
    userPoolId: string;
    tokenUse: 'id';
    clientId: string;
  }>;
  private cognitoClientId: string;
  private cognitoUserPoolId: string;

  constructor(private readonly configService: ConfigService<ApiHandlerConfig>) {
    this.log.log('Initializing Token Service...');

    this.cognitoClientId = this.configService.getOrThrow('cognitoClientId');
    this.cognitoUserPoolId = this.configService.getOrThrow('cognitoUserPoolId');
  }

  /**
   *
   * Asynchronously verify a JWT access_token.
   *
   * @param token The token as a string
   * @returns Promise that resolves to the payload of the JWT––if the JWT is valid, otherwise the promise rejects
   */
  async verifyAccessToken(token: string) {
    this.log.debug('Verifying access token');

    try {
      return await this.accessTokenVerifier.verify(token);
    } catch (error: unknown) {
      this.log.error(error);
      throw error;
    }
  }

  /**
   *
   * Asynchronously verify a JWT id_token.
   *
   * @param token The token as a string
   * @returns Promise that resolves to the payload of the JWT––if the JWT is valid, otherwise the promise rejects
   */
  async verifyIdToken(token: string) {
    this.log.debug('Verifying ID token');

    try {
      return await this.idTokenVerifier.verify(token);
    } catch (error: unknown) {
      this.log.error(error);
      throw error;
    }
  }

  decodeJwt(token: string) {
    try {
      const parts = token.split('.');

      if (parts.length !== 3) throw new Error('Invalid JWT');

      const decodedPayload = Buffer.from(parts[1], 'base64').toString('utf8');
      return JSON.parse(decodedPayload);
    } catch (error) {
      this.log.error(error);
      throw error;
    }
  }

  extractTokenFromHeader(request: Request): string | undefined {
    return this.extractToken(request, 'access_token', true);
  }

  extractToken(request: Request, tokenName = 'access_token', checkAuthHeader = true): string | undefined {
    if (request.cookies && request.cookies[tokenName]) return request.cookies[tokenName];

    if (checkAuthHeader && request.headers.authorization) {
      const [type, token] = request.headers.authorization?.split(' ') ?? [];
      if (type === 'Bearer') return token;
    }

    return undefined;
  }

  onModuleInit() {
    this.accessTokenVerifier = CognitoJwtVerifier.create({
      userPoolId: this.cognitoUserPoolId,
      tokenUse: 'access',
      clientId: this.cognitoClientId,
    });

    this.idTokenVerifier = CognitoJwtVerifier.create({
      userPoolId: this.cognitoUserPoolId,
      tokenUse: 'id',
      clientId: this.cognitoClientId,
    });
  }
}
