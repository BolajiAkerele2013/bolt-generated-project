import api from './api';

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    skills: string;
    interests: string;
  };
  token: string;
}

export const authService = {
  async signup(data: {
    email: string;
    password: string;
    name: string;
  }): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>('/auth/signup', data);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  async login(data: {
    email: string;
    password: string;
  }): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>('/auth/login', data);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  }
};
