import api from './api';

interface RoleUser {
  userId: string;
  email: string;
  role: string;
  equityPercentage?: number;
  debtAmount?: number;
  startDate?: string;
  endDate?: string;
}

interface IdeaRoles {
  id: string;
  name: string;
  users: RoleUser[];
}

export const roleService = {
  async getIdeaRoles(ideaId: string): Promise<IdeaRoles> {
    const response = await api.get(`/api/ideas/${ideaId}/roles`);
    return response.data;
  },

  async addRole(ideaId: string, data: {
    email: string;
    role: string;
    equityPercentage?: number;
    debtAmount?: number;
    startDate?: Date;
    endDate?: Date;
  }) {
    const response = await api.post(`/api/ideas/${ideaId}/roles`, data);
    return response.data;
  },

  async removeRole(ideaId: string, userId: string) {
    const response = await api.delete(`/api/ideas/${ideaId}/roles/${userId}`);
    return response.data;
  }
};
