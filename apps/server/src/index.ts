import express, { type Request, type Response } from 'express';
import cors from 'cors';
import axios from 'axios';
import type { Coin, CoinDetail, ApiResponse } from '@chainly/shared';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: '*',
  })
);

app.use(express.json());

// Fallback single coin to guarantee base properties exist if FALLBACK_COINS is empty
const DEFAULT_COIN: Coin = {
  id: 'bitcoin',
  symbol: 'btc',
  name: 'Bitcoin',
  image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
  current_price: 64250,
  market_cap: 1265000000000,
  price_change_percentage_24h: 2.45,
};

// Mock fallback dataset for main coin table (HTTP 429 mitigation)
const FALLBACK_COINS: Coin[] = [
  DEFAULT_COIN,
  {
    id: 'ethereum',
    symbol: 'eth',
    name: 'Ethereum',
    image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
    current_price: 3480,
    market_cap: 418000000000,
    price_change_percentage_24h: -1.12,
  },
  {
    id: 'solana',
    symbol: 'sol',
    name: 'Solana',
    image: 'https://assets.coingecko.com/coins/images/4128/large/solana.png',
    current_price: 145.2,
    market_cap: 67800000000,
    price_change_percentage_24h: 5.84,
  },
  {
    id: 'binancecoin',
    symbol: 'bnb',
    name: 'BNB',
    image: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png',
    current_price: 580.1,
    market_cap: 85200000000,
    price_change_percentage_24h: 0.75,
  },
  {
    id: 'ripple',
    symbol: 'xrp',
    name: 'XRP',
    image: 'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png',
    current_price: 0.58,
    market_cap: 32500000000,
    price_change_percentage_24h: -0.45,
  },
];

// Mock fallback for single coin details (Guarded against undefined)
const FALLBACK_COIN_DETAIL = (id: string): CoinDetail => {
  const base = FALLBACK_COINS.find((c) => c.id === id) ?? DEFAULT_COIN;

  return {
    id: base.id,
    symbol: base.symbol,
    name: base.name,
    description: {
      en: `${base.name} is a leading cryptocurrency tracked on the Chainly network platform.`,
    },
    image: {
      large: base.image,
      small: base.image,
      thumb: base.image,
    },
    market_data: {
      current_price: { usd: base.current_price ?? 0 },
      high_24h: { usd: (base.current_price ?? 0) * 1.05 },
      low_24h: { usd: (base.current_price ?? 0) * 0.95 },
      price_change_percentage_24h: base.price_change_percentage_24h ?? 0,
      market_cap: { usd: base.market_cap ?? 0 },
    },
  };
};

// Fetch top crypto market prices
app.get('/api/prices', async (_req: Request, res: Response<ApiResponse<Coin[]>>) => {
  try {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    };

    if (process.env.COINGECKO_API_KEY) {
      headers['x-cg-demo-api-key'] = process.env.COINGECKO_API_KEY;
    }

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
        headers,
        timeout: 5000,
      }
    );

    res.json({
      success: true,
      data: response.data,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.warn('CoinGecko market API unavailable/rate-limited. Serving fallback market data.');

    res.json({
      success: true,
      data: FALLBACK_COINS,
      timestamp: Date.now(),
    });
  }
});

// Fetch detailed data for a specific coin by ID
app.get('/api/prices/:id', async (req: Request, res: Response<ApiResponse<CoinDetail>>) => {
  const paramId = req.params.id;
  const id = Array.isArray(paramId) ? paramId[0] : paramId;

  if (!id) {
    res.status(400).json({
      success: false,
      data: FALLBACK_COIN_DETAIL('bitcoin'),
      timestamp: Date.now(),
      error: 'Invalid or missing coin ID parameter',
    });
    return;
  }

  try {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    };

    if (process.env.COINGECKO_API_KEY) {
      headers['x-cg-demo-api-key'] = process.env.COINGECKO_API_KEY;
    }

    const response = await axios.get<CoinDetail>(
      `https://api.coingecko.com/api/v3/coins/${id}`,
      {
        params: {
          localization: false,
          tickers: false,
          community_data: false,
          developer_data: false,
          sparkline: false,
        },
        headers,
        timeout: 5000,
      }
    );

    res.json({
      success: true,
      data: response.data,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.warn(`CoinGecko detail endpoint for '${id}' failed. Serving fallback coin detail.`);

    res.json({
      success: true,
      data: FALLBACK_COIN_DETAIL(id),
      timestamp: Date.now(),
    });
  }
});

app.listen(PORT, () => {
  console.log(`⚡️ [Chainly Server]: Running on port ${PORT}`);
});