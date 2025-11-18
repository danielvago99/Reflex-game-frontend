/**
 * API Client Utility
 * Handles all HTTP requests to the backend API
 * 
 * INTEGRATION STEPS:
 * 1. Replace mock data with real API calls
 * 2. Add authentication token to headers
 * 3. Implement refresh token logic
 * 4. Add proper error handling
 */

import { ENV } from '../config/env';
import type { ApiResponse } from '../types/api';

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor() {
    this.baseURL = ENV.API_BASE_URL;
    this.loadToken();
  }

  /**
   * Set authentication token
   */
  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  /**
   * Load token from localStorage
   */
  private loadToken() {
    this.token = localStorage.getItem('auth_token');
  }

  /**
   * Clear authentication token
   */
  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  /**
   * Get default headers
   */
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  /**
   * Make HTTP request
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      // If using mock data, return mock response
      if (ENV.USE_MOCK_DATA) {
        console.log('[API Mock]', endpoint, options);
        return this.getMockResponse<T>(endpoint, options);
      }

      const url = `${this.baseURL}${endpoint}`;
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('[API Error]', endpoint, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  /**
   * Mock response for development
   * TODO: Remove when backend is ready
   */
  private getMockResponse<T>(endpoint: string, options: RequestInit): ApiResponse<T> {
    console.log('[API Mock Response]', endpoint);
    
    // Simulate network delay
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          data: {} as T,
          message: 'Mock response - backend not connected',
        });
      }, 500);
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// ============================================================================
// API ENDPOINTS
// ============================================================================

export const API = {
  // Auth endpoints
  auth: {
    login: (data: any) => apiClient.post('/auth/login', data),
    logout: () => apiClient.post('/auth/logout'),
    refresh: () => apiClient.post('/auth/refresh'),
    verifyWallet: (data: any) => apiClient.post('/auth/verify-wallet', data),
  },

  // User endpoints
  user: {
    getProfile: () => apiClient.get('/user/profile'),
    updateProfile: (data: any) => apiClient.put('/user/profile', data),
    getStats: () => apiClient.get('/user/stats'),
    getTransactions: (page: number = 1) => apiClient.get(`/user/transactions?page=${page}`),
  },

  // Wallet endpoints
  wallet: {
    create: (data: any) => apiClient.post('/wallet/create', data),
    getBalance: () => apiClient.get('/wallet/balance'),
    deposit: (data: any) => apiClient.post('/wallet/deposit', data),
    withdraw: (data: any) => apiClient.post('/wallet/withdraw', data),
    getTransactions: (page: number = 1) => apiClient.get(`/wallet/transactions?page=${page}`),
  },

  // Game endpoints
  game: {
    createLobby: (data: any) => apiClient.post('/game/lobby/create', data),
    joinLobby: (data: any) => apiClient.post('/game/lobby/join', data),
    leaveLobby: (lobbyId: string) => apiClient.post(`/game/lobby/${lobbyId}/leave`),
    getActiveLobby: () => apiClient.get('/game/lobby/active'),
    submitAction: (data: any) => apiClient.post('/game/action', data),
    getHistory: (page: number = 1) => apiClient.get(`/game/history?page=${page}`),
  },

  // Ambassador endpoints
  ambassador: {
    getProfile: () => apiClient.get('/ambassador/profile'),
    createReferralCode: (data: any) => apiClient.post('/ambassador/referral-code', data),
    getReferrals: (page: number = 1) => apiClient.get(`/ambassador/referrals?page=${page}`),
    getRewards: (page: number = 1) => apiClient.get(`/ambassador/rewards?page=${page}`),
    getStats: () => apiClient.get('/ambassador/stats'),
  },

  // Leaderboard endpoints
  leaderboard: {
    getTop: (limit: number = 100) => apiClient.get(`/leaderboard/top?limit=${limit}`),
    getUserRank: () => apiClient.get('/leaderboard/user/rank'),
  },
};
