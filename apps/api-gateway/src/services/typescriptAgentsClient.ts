import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { config } from '../config/env.js';

class TypeScriptAgentsClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.typescriptAgentsUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        console.log(`[TS Agents] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('[TS Agents] Request error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        console.log(`[TS Agents] Response ${response.status} from ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error('[TS Agents] Response error:', error.message);
        return Promise.reject(error);
      }
    );
  }

  async get<T = any>(path: string, params?: Record<string, any>): Promise<AxiosResponse<T>> {
    return this.client.get<T>(path, { params });
  }

  async post<T = any>(path: string, data?: any): Promise<AxiosResponse<T>> {
    return this.client.post<T>(path, data);
  }

  async put<T = any>(path: string, data?: any): Promise<AxiosResponse<T>> {
    return this.client.put<T>(path, data);
  }

  async delete<T = any>(path: string): Promise<AxiosResponse<T>> {
    return this.client.delete<T>(path);
  }

  async patch<T = any>(path: string, data?: any): Promise<AxiosResponse<T>> {
    return this.client.patch<T>(path, data);
  }
}

export const typescriptAgentsClient = new TypeScriptAgentsClient();
