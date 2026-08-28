import type { Request, Response } from 'express';
import app from '../server';

// Serverless entrypoint for Vercel
export default function handler(req: Request, res: Response) {
  return app(req, res);
}
