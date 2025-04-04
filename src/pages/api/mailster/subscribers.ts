import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const MAILSTER_API_URL = `${process.env.WORDPRESS_URL}/wp-json/wp/v2/wpo_mailster`;
  const AUTH_TOKEN = Buffer.from(`${process.env.MAILSTER_USER}:${process.env.MAILSTER_PASS}`).toString('base64');

  if (req.method === 'POST') {
    try {
      const { email, firstname, lastname, list_ids } = req.body;

      const response = await fetch(MAILSTER_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${AUTH_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          firstname,
          lastname,
          list_ids: list_ids || [37], // Default to free trial list
        }),
      });

      const data = await response.json();
      res.status(200).json(data);
    } catch (error) {
      console.error('Mailster subscriber error:', error);
      res.status(500).json({ message: 'Error creating subscriber' });
    }
  } else if (req.method === 'GET') {
    try {
      const response = await fetch(`${MAILSTER_API_URL}${req.query.conditions ? '?' + new URLSearchParams(req.query as any).toString() : ''}`, {
        headers: {
          'Authorization': `Basic ${AUTH_TOKEN}`,
        },
      });

      const data = await response.json();
      res.status(200).json(data);
    } catch (error) {
      console.error('Mailster fetch error:', error);
      res.status(500).json({ message: 'Error fetching subscribers' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
} 