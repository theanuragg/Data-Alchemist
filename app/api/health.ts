import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    endpoints: {
      upload: 'POST /api/upload',
      validate: 'POST /api/validate',
      search: 'POST /api/search',
      rules: 'GET|POST|PUT|DELETE /api/rules',
      priorities: 'GET|POST /api/priorities',
      export: 'POST /api/export',
      dataCorrection: 'POST /api/data-correction',
      modify: 'POST /api/modify'
    }
  });
}