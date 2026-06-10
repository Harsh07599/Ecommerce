// User model — describes a logged-in user's identity
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

// What is stored in sessionStorage as a mock JWT payload
export interface SessionToken {
  user: User;
  issuedAt: number;
}
