import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // First, try to authenticate with WordPress
    const credentials = Buffer.from(
      `${process.env.MAILSTER_USER}:${process.env.MAILSTER_PASS}`
    ).toString('base64');

    // Try different WordPress REST API endpoints that Mailster might use
    const endpoints = [
      '/wp-json/wp/v2/mailster-lists',
      '/wp-json/wp/v2/mailster/lists',
      '/wp-json/mailster/v2/lists',
      '/wp-json/wp/v2/users/me' // This should work if authentication is correct
    ];

    const results = await Promise.all(
      endpoints.map(async (endpoint) => {
        try {
          const response = await fetch(`${process.env.WORDPRESS_URL}${endpoint}`, {
            headers: {
              'Authorization': `Basic ${credentials}`,
              'Content-Type': 'application/json'
            }
          });
          
          const data = await response.json();
          return {
            endpoint,
            status: response.status,
            data
          };
        } catch (error) {
          return {
            endpoint,
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      })
    );

    return res.status(200).json({
      success: true,
      message: 'API endpoint test results',
      results
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to test API endpoints',
    });
  }
} 