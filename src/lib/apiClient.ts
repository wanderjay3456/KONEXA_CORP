/**
 * KONEXA Enterprise API Client
 * 
 * Standard API interaction helper providing unified error handling,
 * request parsing, authentication headers integration, and standard response formats.
 */

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    page?: number;
    limit?: number;
    totalCount?: number;
    hasMore?: boolean;
    timestamp: number;
  };
}

export class ApiError extends Error {
  public code: string;
  public details?: any;

  constructor(message: string, code = "API_UNKNOWN_ERROR", details?: any) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.details = details;
  }
}

class ApiClient {
  private baseUri: string;

  constructor(baseUri = "/api") {
    this.baseUri = baseUri;
  }

  /**
   * Universal fetch handler with standard response parsing
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUri}${endpoint}`;
    
    // Default headers
    const headers = new Headers(options.headers || {});
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      console.log(`[KONEXA ApiClient] Requesting: ${config.method || "GET"} ${url}`);
      const response = await fetch(url, config);
      
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        return {
          success: false,
          data: null,
          error: {
            code: payload?.error?.code || `HTTP_${response.status}`,
            message: payload?.error?.message || response.statusText || "Server responded with an error.",
            details: payload?.error?.details
          },
          metadata: { timestamp: Date.now() }
        };
      }

      return {
        success: true,
        data: payload?.data ?? payload,
        metadata: {
          page: payload?.metadata?.page,
          limit: payload?.metadata?.limit,
          totalCount: payload?.metadata?.totalCount,
          hasMore: payload?.metadata?.hasMore,
          timestamp: Date.now()
        }
      };
    } catch (err: any) {
      console.error(`[KONEXA ApiClient] Network/Runtime error during request to ${url}:`, err);
      return {
        success: false,
        data: null,
        error: {
          code: "NETWORK_FAILURE",
          message: err.message || "A network or runtime connection failure occurred.",
        },
        metadata: { timestamp: Date.now() }
      };
    }
  }

  public async get<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  }

  public async post<T>(endpoint: string, body: any, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: JSON.stringify(body)
    });
  }

  public async put<T>(endpoint: string, body: any, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: JSON.stringify(body)
    });
  }

  public async delete<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  }
}

export const apiClient = new ApiClient();
