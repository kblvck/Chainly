'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { TrendingUp, RefreshCw, Search, Star, Briefcase } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Coin, ApiResponse } from '@chainly/shared';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const fetchCryptoPrices = async (): Promise<Coin[]> => {
  const res = await axios.get<ApiResponse<Coin[]>>(`${API_BASE_URL}/api/prices`);
  return res.data.data;
};

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'watchlist'>('all');
  const [watchlist, setWatchlist] = useState<string[]>([]);

  // Load watchlist from localStorage on client mount
  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem('chainly_watchlist');
      if (saved) {
        setWatchlist(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load watchlist from localStorage', e);
    }
  }, []);

  // Save watchlist to localStorage on change
  const toggleWatchlist = (coinId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setWatchlist((prev) => {
      const updated = prev.includes(coinId)
        ? prev.filter((id) => id !== coinId)
        : [...prev, coinId];

      localStorage.setItem('chainly_watchlist', JSON.stringify(updated));
      return updated;
    });
  };

  const { data: coins, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['cryptoPrices'],
    queryFn: fetchCryptoPrices,
  });

  // Filter coins dynamically based on search input and active tab
  const filteredCoins = useMemo(() => {
    if (!coins) return [];

    let result = coins;

    // Watchlist filter
    if (activeTab === 'watchlist') {
      result = result.filter((coin) => watchlist.includes(coin.id));
    }

    // Search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (coin) =>
          coin.name.toLowerCase().includes(query) ||
          coin.symbol.toLowerCase().includes(query)
      );
    }

    return result;
  }, [coins, searchQuery, activeTab, watchlist]);

  return (
    <main className="max-w-6xl mx-auto px-4 py-12 w-full">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 text-slate-100">
            <TrendingUp className="text-emerald-400" />
            Chainly Crypto Tracker
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time cryptocurrency market updates powered by Express & CoinGecko
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/portfolio"
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-sm transition-all border border-emerald-500/30 font-medium"
          >
            <Briefcase className="w-4 h-4" />
            Portfolio
          </Link>
          <button
            onClick={() => refetch()}
            disabled={mounted ? isFetching : false}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 rounded-lg text-sm transition-all border border-slate-700 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${mounted && isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </header>

      {/* Controls: Search & Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by coin name or symbol (e.g. Bitcoin, BTC)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-slate-800 text-slate-100 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Coins
          </button>
          <button
            onClick={() => setActiveTab('watchlist')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'watchlist'
                ? 'bg-slate-800 text-amber-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Star className="w-3.5 h-3.5 fill-current" />
            Watchlist ({mounted ? watchlist.length : 0})
          </button>
        </div>
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
                <th className="p-4 w-10 text-center"></th>
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
                  const isFavorited = watchlist.includes(coin.id);

                  return (
                    <tr
                      key={coin.id}
                      className="hover:bg-slate-800/60 transition-colors group"
                    >
                      <td className="p-4 text-center">
                        <button
                          onClick={(e) => toggleWatchlist(coin.id, e)}
                          title={isFavorited ? 'Remove from Watchlist' : 'Add to Watchlist'}
                          className="p-1 text-slate-600 hover:text-amber-400 transition-colors cursor-pointer"
                        >
                          <Star
                            className={`w-4 h-4 ${
                              isFavorited ? 'text-amber-400 fill-amber-400' : ''
                            }`}
                          />
                        </button>
                      </td>
                      <td className="p-4">
                        <Link href={`/coins/${coin.id}`} className="flex items-center gap-3 w-full">
                          <Image
                            src={coin.image}
                            alt={coin.name}
                            width={24}
                            height={24}
                            unoptimized
                            className="rounded-full group-hover:scale-110 transition-transform"
                          />
                          <div>
                            <span className="font-semibold block text-slate-100 group-hover:text-emerald-400 transition-colors">
                              {coin.name}
                            </span>
                            <span className="text-xs text-slate-500 uppercase">{coin.symbol}</span>
                          </div>
                        </Link>
                      </td>
                      <td className="p-4 font-mono font-medium">
                        <Link href={`/coins/${coin.id}`} className="block w-full text-slate-100">
                          ${coin.current_price ? coin.current_price.toLocaleString() : 'N/A'}
                        </Link>
                      </td>
                      <td className="p-4">
                        <Link href={`/coins/${coin.id}`} className="block w-full">
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
                        </Link>
                      </td>
                      <td className="p-4 text-right font-mono text-slate-400">
                        <Link href={`/coins/${coin.id}`} className="block w-full">
                          ${coin.market_cap ? coin.market_cap.toLocaleString() : 'N/A'}
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    {activeTab === 'watchlist'
                      ? 'Your watchlist is empty. Star some coins to track them here!'
                      : `No cryptocurrencies found matching "${searchQuery}"`}
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