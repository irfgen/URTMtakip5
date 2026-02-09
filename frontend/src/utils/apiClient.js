import axios from 'axios';
import getApiBaseUrl from './getApiBaseUrl';
import { testBackendConnection } from './portDiscovery';

class ApiClient {
  constructor() {
    this.baseUrl = '';
    this.port = 3000;
    this.isInitialized = false;
    this.initPromise = this.initialize();
    this.retryCount = 0;
    this.maxRetries = 3;
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      this.baseUrl = getApiBaseUrl();
      console.log(`API Client initialized with backend at: ${this.baseUrl}`);

      // Test backend connectivity
      const isConnected = await testBackendConnection();
      if (!isConnected) {
        console.warn('Backend connectivity test failed, but client will continue...');
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize API client:', error);
      this.baseUrl = getApiBaseUrl();
      this.isInitialized = true;
    }
  }

  createAxiosInstance() {
    const instance = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    instance.interceptors.request.use(
      (config) => {
        console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    instance.interceptors.response.use(
      (response) => {
        console.log(`API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      async (error) => {
        const originalRequest = error.config;

        // Retry logic for network errors
        if (this.shouldRetry(error) && this.retryCount < this.maxRetries) {
          this.retryCount++;
          console.log(`Retrying request (${this.retryCount}/${this.maxRetries}):`, originalRequest.url);

          // Wait before retrying
          await this.delay(1000 * this.retryCount);

          try {
            // Re-initialize backend connection
            await this.initialize();
            originalRequest.baseURL = this.baseUrl;

            return instance(originalRequest);
          } catch (retryError) {
            console.error('Retry failed:', retryError);
          }
        }

        console.error(`API Response Error (${originalRequest?.url}):`, error.message);

        // Return detailed error information
        if (error.response) {
          // Server responded with error status
          throw {
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data,
            message: `API request failed: ${error.response.status} ${error.response.statusText}`,
          };
        } else if (error.request) {
          // Network error
          throw {
            status: 0,
            statusText: 'Network Error',
            data: null,
            message: 'Network error: Could not connect to backend server',
          };
        } else {
          // Other error
          throw {
            status: -1,
            statusText: 'Request Error',
            data: null,
            message: error.message || 'Unknown API error occurred',
          };
        }
      }
    );

    return instance;
  }

  shouldRetry(error) {
    // Retry on network errors or 5xx server errors
    return !error.response || (error.response.status >= 500 && error.response.status < 600);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async request(endpoint, options = {}) {
    await this.initPromise;

    try {
      const axiosInstance = this.createAxiosInstance();

      const config = {
        url: endpoint,
        method: options.method || 'GET',
        data: options.data,
        headers: {
          ...axiosInstance.defaults.headers,
          ...options.headers,
        },
        params: options.params,
        responseType: options.responseType || 'json',
      };

      const response = await axiosInstance(config);
      return response.data;
    } catch (error) {
      console.error(`API Request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // File upload method
  async upload(endpoint, formData, onProgress) {
    await this.initPromise;

    try {
      const axiosInstance = this.createAxiosInstance();

      const response = await axiosInstance.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(percentCompleted);
          }
        },
      });

      return response.data;
    } catch (error) {
      console.error(`File upload failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Standard HTTP methods
  async get(endpoint, params = {}) {
    return this.request(endpoint, { method: 'GET', params });
  }

  async post(endpoint, data = {}) {
    return this.request(endpoint, { method: 'POST', data });
  }

  async put(endpoint, data = {}) {
    return this.request(endpoint, { method: 'PUT', data });
  }

  async patch(endpoint, data = {}) {
    return this.request(endpoint, { method: 'PATCH', data });
  }

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // Utility methods
  getPort() {
    return this.port;
  }

  setPort(port) {
    this.port = port;
    this.baseUrl = getApiBaseUrl();
    this.isInitialized = false;
    this.initPromise = this.initialize();
  }

  getBaseUrl() {
    return this.baseUrl;
  }

  async healthCheck() {
    try {
      const response = await this.get('/port-info');
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error };
    }
  }
}

// Create a singleton instance
const apiClient = new ApiClient();

export default apiClient;
