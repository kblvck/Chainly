export interface Coin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number | null;
  market_cap: number | null;
  price_change_percentage_24h: number | null;
}

export interface CoinDetail extends Omit<Coin, 'image'> {
  image?: string | {
    thumb?: string;
    small?: string;
    large?: string;
  };
  description?: {
    en?: string;
  };
  market_data?: {
    current_price?: {
      usd?: number;
    };
    high_24h?: {
      usd?: number;
    };
    low_24h?: {
      usd?: number;
    };
    price_change_24h?: number;
    price_change_percentage_24h?: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: number;
  error?: string;
}