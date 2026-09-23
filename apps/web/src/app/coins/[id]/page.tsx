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
        <p className="text-slate-400 animate-pulse">Loading coin details and market data...</p>
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

  // Market stats calculation
  const marketData = coin.market_data as any;
  const currentPrice = marketData?.current_price?.usd ?? 0;
  const high24h = marketData?.high_24h?.usd;
  const low24h = marketData?.low_24h?.usd;
  const priceChange = marketData?.price_change_percentage_24h ?? 0;
  const isPositive = priceChange >= 0;

  // Native SVG Chart Coordinate Generator
  const sparklinePrices: number[] = marketData?.sparkline_7d?.price || [];
  const svgWidth = 800;
  const svgHeight = 220;

  let pointsString = '';
  let areaPointsString = '';

  if (sparklinePrices.length > 0) {
    const minPrice = Math.min(...sparklinePrices);
    const maxPrice = Math.max(...sparklinePrices);
    const range = maxPrice - minPrice || 1;

    const points = sparklinePrices.map((price, i) => {
      const x = (i / (sparklinePrices.length - 1)) * svgWidth;
      const y = svgHeight - ((price - minPrice) / range) * (svgHeight - 20) - 10;
      return `${x},${y}`;
    });

    pointsString = points.join(' ');
    areaPointsString = `0,${svgHeight} ${pointsString} ${svgWidth},${svgHeight}`;
  }

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
          <p className={`text-2xl font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
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

      {/* 7-Day Sparkline Price Chart (Native SVG) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">7-Day Price Trend</h2>
        {sparklinePrices.length > 0 ? (
          <div className="w-full overflow-hidden">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-56 stroke-2 fill-none"
            >
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor={isPositive ? '#10b981' : '#f43f5e'}
                    stopOpacity="0.3"
                  />
                  <stop
                    offset="100%"
                    stopColor={isPositive ? '#10b981' : '#f43f5e'}
                    stopOpacity="0.0"
                  />
                </linearGradient>
              </defs>

              {/* Area Under Curve */}
              <polygon points={areaPointsString} fill="url(#chartGradient)" stroke="none" />

              {/* Trend Line */}
              <polyline
                points={pointsString}
                stroke={isPositive ? '#10b981' : '#f43f5e'}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        ) : (
          <div className="text-slate-500 text-center py-12">
            No 7-day sparkline data available for this coin.
          </div>
        )}
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