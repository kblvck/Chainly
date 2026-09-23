'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Briefcase, Plus, Trash2, ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react';
import type { Coin, ApiResponse } from '@chainly/shared';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface Holding {
  id: string; // Coin ID e.g. "bitcoin"
  amount: number;
  buyPrice: number;
}

const fetchCryptoPrices = async (): Promise<Coin[]> => {
  const res = await axios.get<ApiResponse<Coin[]>>(`${API_BASE_URL}/api/prices`);
  return res.data.data;
};

export default function PortfolioPage() {
  const [mounted, setMounted] = useState(false);
  const [holdings, setHoldings] = useState<Holding[]>([]);

  // Form states
  const [selectedCoinId, setSelectedCoinId] = useState<string>('');
  const [amountInput, setAmountInput] = useState<string>('');
  const [buyPriceInput, setBuyPriceInput] = useState<string>('');

  // Fetch live market prices to calculate current net worth
  const { data: coins, isLoading } = useQuery({
    queryKey: ['cryptoPrices'],
    queryFn: fetchCryptoPrices,
  });

  // Load holdings from localStorage
  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem('chainly_portfolio');
      if (saved) {
        setHoldings(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load portfolio from localStorage', e);
    }
  }, []);

  // Save holdings to localStorage
  const saveHoldings = (updated: Holding[]) => {
    setHoldings(updated);
    localStorage.setItem('chainly_portfolio', JSON.stringify(updated));
  };

  const handleAddHolding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCoinId || !amountInput || !buyPriceInput) return;

    const amount = parseFloat(amountInput);
    const buyPrice = parseFloat(buyPriceInput);

    if (isNaN(amount) || isNaN(buyPrice) || amount <= 0 || buyPrice <= 0) return;

    const existingIndex = holdings.findIndex((h) => h.id === selectedCoinId);
    let updated: Holding[];

    if (existingIndex > -1) {
      // Average buy price calculation
      const existing = holdings[existingIndex];
      const totalAmount = existing.amount + amount;
      const totalCost = existing.amount * existing.buyPrice + amount * buyPrice;
      const avgPrice = totalCost / totalAmount;

      updated = [...holdings];
      updated[existingIndex] = {
        id: selectedCoinId,
        amount: totalAmount,
        buyPrice: avgPrice,
      };
    } else {
      updated = [...holdings, { id: selectedCoinId, amount, buyPrice }];
    }

    saveHoldings(updated);
    setAmountInput('');
    setBuyPriceInput('');
  };

  const handleRemoveHolding = (id: string) => {
    const updated = holdings.filter((h) => h.id !== id);
    saveHoldings(updated);
  };

  // Auto-fill current market price when selecting a coin
  const handleCoinSelect = (coinId: string) => {
    setSelectedCoinId(coinId);
    const selectedCoin = coins?.find((c) => c.id === coinId);
    if (selectedCoin) {
      setBuyPriceInput(selectedCoin.current_price.toString());
    }
  };

  // Calculate total portfolio values
  const portfolioSummary = useMemo(() => {
    if (!coins || holdings.length === 0) {
      return { totalValue: 0, totalCost: 0, profitLoss: 0, profitLossPercent: 0 };
    }

    let totalValue = 0;
    let totalCost = 0;

    holdings.forEach((h) => {
      const liveCoin = coins.find((c) => c.id === h.id);
      const currentPrice = liveCoin?.current_price ?? h.buyPrice;
      totalValue += h.amount * currentPrice;
      totalCost += h.amount * h.buyPrice;
    });

    const profitLoss = totalValue - totalCost;
    const profitLossPercent = totalCost > 0 ? (profitLoss / totalCost) * 100 : 0;

    return { totalValue, totalCost, profitLoss, profitLossPercent };
  }, [coins, holdings]);

  return (
    <main className="max-w-5xl mx-auto px-4 py-12 text-slate-100">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-emerald-400 hover:underline text-sm font-medium mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Markets
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <Briefcase className="w-8 h-8 text-emerald-400" />
        <div>
          <h1 className="text-3xl font-bold">Portfolio Tracker</h1>
          <p className="text-slate-400 text-sm">
            Track your crypto holdings and total return in real-time
          </p>
        </div>
      </div>

      {/* Portfolio Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <p className="text-xs text-slate-400 mb-1">TOTAL PORTFOLIO VALUE</p>
          <p className="text-3xl font-bold font-mono">
            ${portfolioSummary.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <p className="text-xs text-slate-400 mb-1">TOTAL INVESTMENT COST</p>
          <p className="text-2xl font-bold font-mono text-slate-300">
            ${portfolioSummary.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <p className="text-xs text-slate-400 mb-1">TOTAL PROFIT / LOSS</p>
          <div
            className={`flex items-center gap-2 text-2xl font-bold font-mono ${
              portfolioSummary.profitLoss >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {portfolioSummary.profitLoss >= 0 ? (
              <TrendingUp className="w-6 h-6" />
            ) : (
              <TrendingDown className="w-6 h-6" />
            )}
            ${portfolioSummary.profitLoss.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800">
              {portfolioSummary.profitLoss >= 0 ? '+' : ''}
              {portfolioSummary.profitLossPercent.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      {/* Form: Add Transaction */}
      <form
        onSubmit={handleAddHolding}
        className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-8 flex flex-col md:flex-row items-end gap-4"
      >
        <div className="flex-1 w-full">
          <label className="block text-xs font-medium text-slate-400 mb-1">Select Asset</label>
          <select
            value={selectedCoinId}
            onChange={(e) => handleCoinSelect(e.target.value)}
            required
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
          >
            <option value="">-- Choose Coin --</option>
            {coins?.map((coin) => (
              <option key={coin.id} value={coin.id}>
                {coin.name} ({coin.symbol.toUpperCase()}) - ${coin.current_price?.toLocaleString()}
              </option>
            ))}
          </select>
        </div>

        <div className="w-full md:w-48">
          <label className="block text-xs font-medium text-slate-400 mb-1">Quantity Owned</label>
          <input
            type="number"
            step="any"
            placeholder="e.g. 0.5"
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            required
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="w-full md:w-48">
          <label className="block text-xs font-medium text-slate-400 mb-1">Buy Price ($)</label>
          <input
            type="number"
            step="any"
            placeholder="e.g. 65000"
            value={buyPriceInput}
            onChange={(e) => setBuyPriceInput(e.target.value)}
            required
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <button
          type="submit"
          className="w-full md:w-auto px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold rounded-lg text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Asset
        </button>
      </form>

      {/* Holdings List */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800">
          <h2 className="text-lg font-bold">Your Holdings</h2>
        </div>

        {!mounted || isLoading ? (
          <div className="p-8 text-center text-slate-400 animate-pulse">Loading holdings...</div>
        ) : holdings.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            No assets in your portfolio yet. Select a coin above to start tracking!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase bg-slate-950/50">
                  <th className="p-4">Asset</th>
                  <th className="p-4">Quantity</th>
                  <th className="p-4">Avg. Buy Price</th>
                  <th className="p-4">Current Price</th>
                  <th className="p-4">Current Value</th>
                  <th className="p-4">Profit / Loss</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {holdings.map((h) => {
                  const coin = coins?.find((c) => c.id === h.id);
                  const currentPrice = coin?.current_price ?? h.buyPrice;
                  const currentValue = h.amount * currentPrice;
                  const costBasis = h.amount * h.buyPrice;
                  const pl = currentValue - costBasis;
                  const plPercent = costBasis > 0 ? (pl / costBasis) * 100 : 0;
                  const isPositive = pl >= 0;

                  return (
                    <tr key={h.id} className="hover:bg-slate-800/40">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {coin?.image && (
                            <Image
                              src={coin.image}
                              alt={coin.name}
                              width={24}
                              height={24}
                              unoptimized
                              className="rounded-full"
                            />
                          )}
                          <span className="font-sans font-semibold text-slate-100">
                            {coin?.name || h.id}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-slate-200">{h.amount}</td>
                      <td className="p-4 text-slate-400">${h.buyPrice.toLocaleString()}</td>
                      <td className="p-4 text-slate-200">${currentPrice.toLocaleString()}</td>
                      <td className="p-4 font-bold text-slate-100">
                        ${currentValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className={`p-4 ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isPositive ? '+' : ''}${pl.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        <span className="text-xs ml-1 font-sans">
                          ({isPositive ? '+' : ''}{plPercent.toFixed(2)}%)
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleRemoveHolding(h.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                          title="Delete holding"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}