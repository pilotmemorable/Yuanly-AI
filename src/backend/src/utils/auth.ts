import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface TokenPayload {
  id: string;
  role: string;
}

export const generateToken = (userId: string, role: string): string => {
  const expiresIn = role === 'ADMIN' ? '12h' : '30d';
  return jwt.sign({ id: userId, role }, env.jwtSecret, { expiresIn, algorithm: 'HS256' });
};

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.jwtSecret, { algorithms: ['HS256'] }) as TokenPayload;
};
