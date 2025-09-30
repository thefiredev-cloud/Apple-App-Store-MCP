import axios, { AxiosInstance, AxiosError } from "axios";
import { JWTAuthenticator } from "../auth/jwt.js";

const API_BASE_URL = "https://api.appstoreconnect.apple.com/v1";

export interface AppStoreConnectError {
  status: string;
  code: string;
  title: string;
  detail: string;
}

export class AppStoreConnectClient {
  private auth: JWTAuthenticator;
  private client: AxiosInstance;
  private requestCount = 0;
  private lastRequestTime = 0;
  private readonly minRequestInterval = 100; // 100ms between requests

  constructor(auth: JWTAuthenticator) {
    this.auth = auth;
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Add request interceptor for authentication and rate limiting
    this.client.interceptors.request.use(
      async (config) => {
        // Add JWT token
        const token = await this.auth.getToken();
        config.headers.Authorization = `Bearer ${token}`;

        // Simple rate limiting
        await this.rateLimit();

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token might be expired, clear cache and retry once
          this.auth.clearCache();
          throw new Error("Authentication failed. Please check your API credentials.");
        }

        if (error.response?.status === 429) {
          // Rate limit hit
          throw new Error("Rate limit exceeded. Please try again later.");
        }

        // Parse App Store Connect error format
        const errorData = error.response?.data as { errors?: AppStoreConnectError[] };
        if (errorData?.errors && errorData.errors.length > 0) {
          const firstError = errorData.errors[0];
          throw new Error(`${firstError.title}: ${firstError.detail}`);
        }

        throw error;
      }
    );
  }

  /**
   * Simple rate limiting to avoid hitting API limits
   */
  private async rateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.minRequestInterval) {
      await new Promise((resolve) =>
        setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest)
      );
    }

    this.lastRequestTime = Date.now();
    this.requestCount++;
  }

  /**
   * Generic GET request with field filtering
   */
  async get<T>(
    endpoint: string,
    params?: Record<string, string | number | boolean>
  ): Promise<T> {
    const response = await this.client.get(endpoint, { params });
    return response.data;
  }

  /**
   * Generic POST request
   */
  async post<T>(endpoint: string, data: unknown): Promise<T> {
    const response = await this.client.post(endpoint, data);
    return response.data;
  }

  /**
   * Generic PATCH request
   */
  async patch<T>(endpoint: string, data: unknown): Promise<T> {
    const response = await this.client.patch(endpoint, data);
    return response.data;
  }

  /**
   * Generic DELETE request
   */
  async delete(endpoint: string): Promise<void> {
    await this.client.delete(endpoint);
  }

  /**
   * List apps with pagination
   */
  async listApps(params?: {
    limit?: number;
    fields?: string[];
    filter?: Record<string, string>;
  }) {
    const queryParams: Record<string, string | number> = {};

    if (params?.limit) {
      queryParams.limit = params.limit;
    }

    if (params?.fields && params.fields.length > 0) {
      queryParams["fields[apps]"] = params.fields.join(",");
    }

    if (params?.filter) {
      Object.entries(params.filter).forEach(([key, value]) => {
        queryParams[`filter[${key}]`] = value;
      });
    }

    return this.get<{
      data: Array<{
        id: string;
        type: string;
        attributes: {
          bundleId: string;
          name: string;
          sku: string;
          primaryLocale: string;
        };
      }>;
      links: {
        self: string;
        next?: string;
      };
    }>("/apps", queryParams);
  }

  /**
   * Get app by ID
   */
  async getApp(appId: string, fields?: string[]) {
    const params: Record<string, string> = {};

    if (fields && fields.length > 0) {
      params["fields[apps]"] = fields.join(",");
    }

    return this.get<{
      data: {
        id: string;
        type: string;
        attributes: {
          bundleId: string;
          name: string;
          sku: string;
          primaryLocale: string;
        };
      };
    }>(`/apps/${appId}`, params);
  }

  /**
   * Create a new app
   */
  async createApp(params: {
    name: string;
    bundleId: string;
    sku: string;
    primaryLocale: string;
  }) {
    return this.post<{
      data: {
        id: string;
        type: string;
        attributes: {
          bundleId: string;
          name: string;
          sku: string;
          primaryLocale: string;
        };
      };
    }>("/apps", {
      data: {
        type: "apps",
        attributes: {
          bundleId: params.bundleId,
          name: params.name,
          sku: params.sku,
          primaryLocale: params.primaryLocale,
        },
      },
    });
  }

  /**
   * List builds for an app
   */
  async listBuilds(appId: string, limit?: number) {
    const params: Record<string, string | number> = {
      "filter[app]": appId,
    };

    if (limit) {
      params.limit = limit;
    }

    return this.get<{
      data: Array<{
        id: string;
        type: string;
        attributes: {
          version: string;
          uploadedDate: string;
          processingState: string;
        };
      }>;
    }>("/builds", params);
  }

  /**
   * Get request statistics
   */
  getStats() {
    return {
      requestCount: this.requestCount,
      lastRequestTime: this.lastRequestTime,
    };
  }
}