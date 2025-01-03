import api from './api';

export interface Idea {
  id: string;
  name: string;
  description: string;
  problemCategory: string;
  solution: string;
  visibility: 'public' | 'private';
  ownerId: string;
  userRole: string;
  createdAt: string;
  updatedAt: string;
  equityPercentage?: number;
  debtAmount?: number;
}

export const ideaService = {
  async createIdea(data: {
    name: string;
    description: string;
    problemCategory: string;
    solution: string;
    visibility: 'public' | 'private';
  }): Promise<Idea> {
    const response = await api.post<Idea>('/ideas', data);
    return response.data;
  },

  async getUserIdeas(): Promise<Idea[]> {
    const response = await api.get<Idea[]>('/ideas');
    return response.data;
  },

  async getIdea(id: string): Promise<Idea> {
    const response = await api.get<Idea>(`/ideas/${id}`);
    return response.data;
  },

  async updateIdea(id: string, data: Partial<Idea>): Promise<Idea> {
    const response = await api.put<Idea>(`/ideas/${id}`, data);
    return response.data;
  }
};
