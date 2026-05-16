'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getPaperAccount, executePaperTrade } from '@/lib/actions/brokerage.actions';
import { getQuote } from '@/lib/actions/finnhub.actions';
import { toast } from 'sonner';
import { Wallet, DollarSign, Activity, ChevronRight, Lock } from 'lucide-react';

export default function TradeTicket({ symbol }: { symbol: string }) {
  const [account, setAccount] = useState<any>(null);
  const [price, setPrice] = useState<number>(0);
  const [action, setAction] = useState<'BUY' | 'SELL'>('BUY');
  const [shares, setShares] = useState<string>('1');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const fetchState = async () => {
    setIsFetching(true);
    try {
      const [accData, quoteData] = await Promise.all([
        getPaperAccount(),
        getQuote(symbol)
      ]);
      if (accData) setAccount(accData);
      if (quoteData && quoteData.c) setPrice(quoteData.c);
    } catch (error) {
      console.error(error);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 15000); // refresh every 15s
    return () => clearInterval(interval);
  }, [symbol]);

  const numShares = parseFloat(shares) || 0;
  const totalCost = numShares * price;
  const isAffordable = action === 'BUY' ? (account?.buyingPower >= totalCost) : true;

  const handleTrade = async () => {
    if (!account) {
      toast.error("Please sign in to use Paper Trading.");
      return;
    }
    if (numShares <= 0) {
      toast.error("Please enter a valid number of shares.");
      return;
    }
    if (action === 'BUY' && !isAffordable) {
      toast.error("Insufficient buying power.");
      return;
    }

    setIsLoading(true);
    const tid = toast.loading(`Executing ${action} order for ${symbol}...`);
    try {
      const res = await executePaperTrade({ symbol, action, shares: numShares });
      if (res.success) {
        toast.success(res.message, { id: tid });
        setShares('1');
        await fetchState(); // refresh balances
      } else {
        toast.error(res.message, { id: tid });
      }
    } catch (e: any) {
      toast.error("Trade failed. Please try again.", { id: tid });
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching && !account) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6 h-[380px] flex items-center justify-center">
        <Activity className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!account) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6 text-center">
        <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
        <h3 className="font-bold text-lg mb-2">Paper Trading Engine</h3>
        <p className="text-sm text-muted-foreground">Sign in to unlock your $100,000 simulated brokerage account.</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-xl relative overflow-hidden group">
      {/* Background glow based on action */}
      <div className={`absolute -top-20 -right-20 w-48 h-48 blur-[80px] rounded-full transition-colors duration-500 opacity-20 pointer-events-none ${action === 'BUY' ? 'bg-emerald-500' : 'bg-red-500'}`} />

      <div className="flex items-center justify-between mb-6 relative z-10">
        <h3 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          Order Ticket
        </h3>
        <div className="bg-secondary/50 px-3 py-1.5 rounded-lg border border-border flex items-center gap-2">
          <Wallet className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-bold font-mono">${account.buyingPower.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      </div>

      <div className="space-y-6 relative z-10">
        {/* Action Toggle */}
        <div className="flex bg-secondary p-1 rounded-xl">
          <button
            onClick={() => setAction('BUY')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${action === 'BUY' ? 'bg-emerald-500 text-black shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
          >
            BUY
          </button>
          <button
            onClick={() => setAction('SELL')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${action === 'SELL' ? 'bg-red-500 text-white shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
          >
            SELL
          </button>
        </div>

        {/* Inputs */}
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Shares</label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="any"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-lg font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                placeholder="0"
              />
            </div>
          </div>
          
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Market Price</span>
            <span className="font-mono font-medium">${price.toFixed(2)}</span>
          </div>
          
          <div className="h-px bg-border w-full" />
          
          <div className="flex justify-between items-center">
            <span className="font-bold">Estimated Cost</span>
            <span className={`font-mono font-bold text-lg ${action === 'BUY' && !isAffordable ? 'text-red-500' : 'text-foreground'}`}>
              ${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={handleTrade}
          disabled={isLoading || (action === 'BUY' && !isAffordable) || numShares <= 0}
          className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none ${
            action === 'BUY' 
              ? 'bg-emerald-500 hover:bg-emerald-600 text-black shadow-emerald-500/20' 
              : 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20'
          }`}
        >
          {isLoading ? (
            <Activity className="w-5 h-5 animate-spin" />
          ) : (
            <>
              {action} {symbol}
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </button>

        {action === 'BUY' && !isAffordable && (
          <p className="text-xs text-red-500 text-center font-medium">
            Exceeds available buying power.
          </p>
        )}
      </div>
    </div>
  );
}
