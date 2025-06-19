import { GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { Test, TestingModule } from '@nestjs/testing';
import { SecretsManagerService } from './secrets-manager.service';

jest.mock('@aws-sdk/client-secrets-manager', () => {
  return {
    SecretsManagerClient: jest.fn().mockImplementation(() => ({
      send: jest.fn(),
    })),
    GetSecretValueCommand: jest.fn(),
  };
});

describe('SecretsManagerService', () => {
  let service: SecretsManagerService;
  let mockClient: { send: jest.Mock };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SecretsManagerService],
    }).compile();

    service = module.get<SecretsManagerService>(SecretsManagerService);
    mockClient = (service as any).client;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSecret', () => {
    it('should return a secret value', async () => {
      const mockSecretId = 'test-secret-id';
      const mockSecretValue = 'test-secret-value';

      mockClient.send.mockResolvedValueOnce({
        SecretString: mockSecretValue,
      });

      const result = await service.getSecret(mockSecretId);

      expect(GetSecretValueCommand).toHaveBeenCalledWith({
        SecretId: mockSecretId,
      });
      expect(mockClient.send).toHaveBeenCalled();
      expect(result).toBe(mockSecretValue);
    });

    it('should return cached secret on subsequent calls', async () => {
      const mockSecretId = 'test-secret-id';
      const mockSecretValue = 'test-secret-value';

      mockClient.send.mockResolvedValueOnce({
        SecretString: mockSecretValue,
      });

      // First call should use the client
      await service.getSecret(mockSecretId);

      // Second call should use the cache
      const result = await service.getSecret(mockSecretId);

      expect(mockClient.send).toHaveBeenCalledTimes(1);
      expect(result).toBe(mockSecretValue);
    });

    it('should throw an error when SecretString is not found', async () => {
      const mockSecretId = 'test-secret-id';

      mockClient.send.mockResolvedValueOnce({
        SecretString: null,
      });

      await expect(service.getSecret(mockSecretId)).rejects.toThrow('No secret string found');
    });

    it('should throw an error when AWS SDK throws an error', async () => {
      const mockSecretId = 'test-secret-id';
      const mockError = new Error('AWS SDK error');

      mockClient.send.mockRejectedValueOnce(mockError);

      await expect(service.getSecret(mockSecretId)).rejects.toThrow(mockError);
    });
  });
});
