export interface Idea {
  id: string;
  name: string;
  description: string;
  problemCategory: string;
  solution: string;
  logo?: string;
  ownerId: string;
  visibility: 'public' | 'private';
  createdAt: string;
  updatedAt: string;
}
