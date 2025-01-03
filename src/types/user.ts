export type UserRole = 'IDEA_OWNER' | 'EQUITY_OWNER' | 'DEBT_FINANCIER' | 'CONTRACTOR' | 'VIEWER';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  portfolio?: string;
  skills: string[];
  interests: string[];
}
