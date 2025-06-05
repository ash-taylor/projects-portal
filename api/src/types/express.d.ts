import { CognitoAccessTokenPayload, CognitoIdTokenPayload } from 'aws-jwt-verify/jwt-model';

declare global {
  // biome-ignore lint/style/noNamespace: <explanation>
  namespace Express {
    interface Request {
      userAccessToken?: CognitoAccessTokenPayload;
      userId?: CognitoIdTokenPayload;
    }
  }
}
