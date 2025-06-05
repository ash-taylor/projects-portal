import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import { Injectable, Logger, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.DEFAULT })
export class SecretsManagerService {
  private readonly log = new Logger(SecretsManagerService.name);

  private readonly client: SecretsManagerClient;
  private cache: Record<string, string> = {};

  constructor() {
    this.log.log('Initializing Secrets Manager Service...');

    this.client = new SecretsManagerClient({});
  }

  async getSecret(secretId: string): Promise<string> {
    if (this.cache[secretId]) return this.cache[secretId];

    try {
      const response = await this.client.send(
        new GetSecretValueCommand({
          SecretId: secretId,
        }),
      );

      if (!response.SecretString) throw new Error('No secret string found');

      this.cache[secretId] = response.SecretString;
      return this.cache[secretId];
    } catch (error) {
      this.log.error(`Error retrieving secret ${secretId}: ${error}`);
      throw error;
    }
  }
}
