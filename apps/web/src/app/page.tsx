'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { TrendingUp, RefreshCw, Search } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import type { Coin, ApiResponse } from '@chainly/shared';

// Use environment variable in production or fallback to localhost during development
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const fetchCryptoPrices = async (): Promise<Coin[]> => {
  const res = await axios.get<ApiResponse<Coin[]>>(`${API_BASE_URL}/api/prices`);
  return res.data.data;
};

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: coins, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['cryptoPrices'],
    queryFn: fetchCryptoPrices,
  });

  // Filter coins dynamically based on search input
  const filteredCoins = useMemo(() => {
    if (!coins) return [];
    if (!searchQuery.trim()) return coins;

    const query = searchQuery.toLowerCase().trim();
    return coins.filter(
      (coin) =>
        coin.name.toLowerCase().includes(query) ||
        coin.symbol.toLowerCase().includes(query)
    );
  }, [coins, searchQuery]);

  return (
    <main className="max-w-6xl mx-auto px-4 py-12 w-full">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <TrendingUp className="text-emerald-400" />
            Chainly Crypto Tracker
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time cryptocurrency market updates powered by Express & CoinGecko
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={mounted ? isFetching : false}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 rounded-lg text-sm transition-all border border-slate-700 disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${mounted && isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </header>

      {/* Search Input Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by coin name or symbol (e.g. Bitcoin, BTC)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
        />
      </div>

      {(!mounted || isLoading) && (
        <div className="text-center py-20 text-slate-400 animate-pulse">
          Loading market prices...
        </div>
      )}

      {mounted && isError && (
        <div className="text-center py-12 px-4 text-rose-400 bg-rose-950/30 border border-rose-900 rounded-xl">
          Failed to connect to backend server. Ensure the server is active.
        </div>
      )}

      {mounted && coins && (
        <div className="overflow-x-auto border border-slate-800 rounded-xl shadow-xl bg-slate-900/50 backdrop-blur">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider bg-slate-900/80">
                <th className="p-4">Asset</th>
                <th className="p-4">Price (USD)</th>
                <th className="p-4">24h Change</th>
                <th className="p-4 text-right">Market Cap</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {filteredCoins.length > 0 ? (
                filteredCoins.map((coin) => {
                  const change = coin.price_change_percentage_24h ?? 0;
                  const isPositive = change >= 0;

                  return (
                    <tr key={coin.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4 flex items-center gap-3">
                        <Image
                          src={coin.image}
                          alt={coin.name}
                          width={24}
                          height={24}
                          unoptimized
                          className="rounded-full"
                        />
                        <div>
                          <span className="font-semibold block">{coin.name}</span>
                          <span className="text-xs text-slate-500 uppercase">{coin.symbol}</span>
                        </div>
                      </td>
                      <td className="p-4 font-mono font-medium">
                        ${coin.current_price ? coin.current_price.toLocaleString() : 'N/A'}
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                            isPositive
                              ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/50'
                              : 'bg-rose-950/60 text-rose-400 border border-rose-800/50'
                          }`}
                        >
                          {isPositive ? '+' : ''}
                          {change.toFixed(2)}%
                        </span>
                      </td>
                      <td className="p-4 text-right font-mono text-slate-400">
                        ${coin.market_cap ? coin.market_cap.toLocaleString() : 'N/A'}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">
                    No cryptocurrencies found matching "{searchQuery}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}