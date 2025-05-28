import { loadConfig } from './config';

/**
 * API client for making requests to the backend
 */
export class ApiClient {
  private apiUrl: string | null = null;
  
  /**
   * Initialize the API client
   */
  async initialize(): Promise<void> {
    const config = await loadConfig();
    this.apiUrl = config.apiUrl;
  }
  
  /**
   * Make a GET request to the API
   */
  async get<T>(path: string): Promise<T> {
    if (!this.apiUrl) {
      await this.initialize();
    }
    
    const response = await fetch(`${this.apiUrl}${path}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  /**
   * Make a POST request to the API
   */
  async post<T>(path: string, data: any): Promise<T> {
    if (!this.apiUrl) {
      await this.initialize();
    }
    
    const response = await fetch(`${this.apiUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }
    
    return response.json();
  }
}

// Export a singleton instance
export const api = new ApiClient();