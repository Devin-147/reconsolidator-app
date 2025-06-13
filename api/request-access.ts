import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  console.log(">>>>>>>> HIT /api/request-access <<<<<<<<<<");
  res.status(200).json({ message: 'Local API test successful!' });
}