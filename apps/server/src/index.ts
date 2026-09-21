import express, { type Request, type Response } from 'express';
import cors from 'cors';
import axios from 'axios';
import type { Coin, ApiResponse } from '@chainly/shared';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: '*', // Allows Vercel frontend requests
  })
);

app.use(express.json());

app.get('/api/prices', async (_req: Request, res: Response<ApiResponse<Coin[]>>) => {
  try {
    const response = await axios.get<Coin[]>(
      'https://api.coingecko.com/api/v3/coins/markets',
      {
        params: {
          vs_currency: 'usd',
          order: 'market_cap_desc',
          per_page: 10,
          page: 1,
          sparkline: false,
        },
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        timeout: 10000,
      }
    );

    res.json({
      success: true,
      data: response.data,
      timestamp: Date.now(),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch coin prices';
    console.error('CoinGecko Error:', errorMessage);

    res.status(500).json({
      success: false,
      data: [],
      timestamp: Date.now(),
      error: errorMessage,
    });
  }
});

app.listen(PORT, () => {
  console.log(`⚡️ [Chainly Server]: Running on port ${PORT}`);
});