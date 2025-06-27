import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { AuthEvents } from '../components/auth/events/AuthEvents';
import { AuthSubject } from '../components/auth/events/AuthSubject';
import type { IAuthSubject } from '../components/auth/events/IAuthSubject';
import { type AppConfig, loadConfig } from '../config/config';

class ApiClient {
  private apiUrl?: string;
  private standardHeaders = {
    APP_JSON: {
      'Content-Type': 'application/json',
    },
  };
  private baseAxiosConfig: AxiosRequestConfig = {};

  constructor(
    private readonly loadConfig: () => Promise<AppConfig>,
    private authSubject: IAuthSubject,
  ) {
    this.initialize();

    this.baseAxiosConfig = {
      headers: this.standardHeaders.APP_JSON,
    };
  }

  async initialize(): Promise<void> {
    const config = await this.loadConfig();
    this.apiUrl = config.apiUrl;
    this.baseAxiosConfig.baseURL = this.apiUrl;

    if (!this.apiUrl) throw new Error('Error getting apiUrl from config');
  }

  async makeRequest<T, D = undefined>(
    url: string,
    options?: AxiosRequestConfig<D>,
    withAuth = false,
  ): Promise<AxiosResponse<T>> {
    if (!this.apiUrl) await this.initialize();

    try {
      return await axios<T, AxiosResponse<T>, D>({
        ...this.baseAxiosConfig,
        ...options,
        withCredentials: withAuth,
        url,
      });
    } catch (error) {
      if (!withAuth || !axios.isAxiosError(error) || !error.response || !this.shouldAttemptRefresh(error.response))
        throw error;

      await this.attemptTokenRefresh();

      return await axios<T, AxiosResponse<T>, D>({
        ...this.baseAxiosConfig,
        ...options,
        withCredentials: withAuth,
        url,
      });
    }
  }

  private async attemptTokenRefresh() {
    try {
      return await axios({
        ...this.baseAxiosConfig,
        url: '/auth/refresh',
        method: 'post',
        withCredentials: true,
      });
    } catch (error) {
      this.authSubject.notify(AuthEvents.AUTH_REFRESH_FAILED);
      throw error;
    }
  }

  private shouldAttemptRefresh(response: AxiosResponse): boolean {
    return [401, 403].includes(response.status) && !response.config.url?.includes('/auth/refresh');
  }
}

export const authSubject = new AuthSubject();
export const apiClient = new ApiClient(loadConfig, authSubject);
