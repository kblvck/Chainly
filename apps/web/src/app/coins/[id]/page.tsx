'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { CoinDetail, ApiResponse } from '@chainly/shared';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function CoinDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: coin, isLoading, isError } = useQuery<CoinDetail>({
    queryKey: ['coin-detail', id],
    queryFn: async () => {
      // Try /api/prices/:id first, fallback to /api/coins/:id if backend uses coins path
      let res = await fetch(`${API_BASE_URL}/api/prices/${id}`);
      if (!res.ok) {
        res = await fetch(`${API_BASE_URL}/api/coins/${id}`);
      }
      if (!res.ok) throw new Error('Failed to load coin details');
      
      const json: ApiResponse<CoinDetail> = await res.json();
      return json.data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-8 flex justify-center items-center">
        <p className="text-slate-400 animate-pulse">Loading coin details...</p>
      </div>
    );
  }

  if (isError || !coin) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-8 max-w-4xl mx-auto">
        <button 
          onClick={() => router.back()} 
          className="text-emerald-400 mb-4 hover:underline cursor-pointer"
        >
          &larr; Back to Market
        </button>
        <div className="p-6 bg-rose-950/30 border border-rose-900 rounded-xl text-rose-400">
          Unable to load details for this coin. Please verify backend server connection.
        </div>
      </div>
    );
  }

  // Safe fallback values matching the CoinDetail shared interface
  const currentPrice = coin.market_data?.current_price?.usd ?? 0;
  const high24h = coin.market_data?.high_24h?.usd;
  const low24h = coin.market_data?.low_24h?.usd;
  const priceChange = coin.market_data?.price_change_percentage_24h ?? 0;
  
  const imageSrc =
    typeof coin.image === 'object' && coin.image !== null
      ? (coin.image as { large?: string; small?: string; thumb?: string }).large ||
        (coin.image as { large?: string; small?: string; thumb?: string }).small ||
        (coin.image as { large?: string; small?: string; thumb?: string }).thumb
      : (coin.image as string | undefined);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-8 max-w-4xl mx-auto">
      <Link href="/" className="inline-block text-emerald-400 mb-6 hover:underline font-medium">
        &larr; Back to Markets
      </Link>

      <div className="flex items-center gap-4 mb-8">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={coin.name}
            className="w-16 h-16 rounded-full border border-slate-800"
          />
        ) : null}
        <div>
          <h1 className="text-3xl font-bold">{coin.name}</h1>
          <span className="text-slate-400 uppercase text-sm font-semibold">{coin.symbol}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <p className="text-xs text-slate-400 mb-1">CURRENT PRICE</p>
          <p className="text-2xl font-bold">${currentPrice.toLocaleString()}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <p className="text-xs text-slate-400 mb-1">24H CHANGE</p>
          <p className={`text-2xl font-bold ${priceChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <p className="text-xs text-slate-400 mb-1">24H RANGE</p>
          <p className="text-sm text-slate-300 font-medium">
            Low: ${low24h ? low24h.toLocaleString() : 'N/A'}
          </p>
          <p className="text-sm text-slate-300 font-medium">
            High: ${high24h ? high24h.toLocaleString() : 'N/A'}
          </p>
        </div>
      </div>

      {coin.description?.en && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-3">About {coin.name}</h2>
          <div
            className="text-slate-300 text-sm leading-relaxed space-y-2 prose prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: coin.description.en }}
          />
        </div>
      )}
    </main>
  );
}