import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const MAILSTER_API_URL = `${process.env.WORDPRESS_URL}/wp-json/wp/v2/wpo_mailster_campaign`;
  const AUTH_TOKEN = Buffer.from(`${process.env.MAILSTER_USER}:${process.env.MAILSTER_PASS}`).toString('base64');

  if (req.method === 'POST') {
    try {
      const { title, content, meta_data } = req.body;

      const campaignData = {
        title,
        content,
        status: 'active',
        meta_data: {
          _mailster_from_name: meta_data._mailster_from_name || 'Reconsolidation Program',
          _mailster_from_email: process.env.MAILSTER_FROM_EMAIL,
          _mailster_reply_to: process.env.MAILSTER_REPLY_TO,
          _mailster_subject: meta_data._mailster_subject,
          _mailster_template: 'mymail',
          _mailster_lists: meta_data._mailster_lists,
        },
      };

      const response = await fetch(MAILSTER_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${AUTH_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(campaignData),
      });

      const data = await response.json();
      res.status(200).json(data);
    } catch (error) {
      console.error('Mailster campaign error:', error);
      res.status(500).json({ message: 'Error creating campaign' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
} 