'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, ChevronDown, RefreshCcw, TrendingUp, TrendingDown, DollarSign, RotateCcw } from 'lucide-react';
import { refillPaperAccount, getPaperAccount } from '@/lib/actions/brokerage.actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface PaperBalanceWidgetProps {
  initialAccount: {
    buyingPower: number;
    initialBalance: number;
  } | null;
}

export default function PaperBalanceWidget({ initialAccount }: PaperBalanceWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isRefilling, setIsRefilling] = useState(false);
  const [account, setAccount] = useState(initialAccount);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Sync with server-rendered prop on navigation
  useEffect(() => {
    if (initialAccount) setAccount(initialAccount);
  }, [initialAccount]);

  // Poll for balance updates every 10 seconds
  useEffect(() => {
    const poll = async () => {
      try {
        const fresh = await getPaperAccount();
        if (fresh) setAccount(fresh);
      } catch {}
    };
    const interval = setInterval(poll, 10000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!account) return null;

  const pnl = account.buyingPower - account.initialBalance;
  const pnlPercent = (pnl / account.initialBalance) * 100;

  const handleRefill = async () => {
    setIsRefilling(true);
    const tid = toast.loading('Resetting paper account...');
    try {
      const res = await refillPaperAccount();
      if (res.success) {
        toast.success(res.message, { id: tid });
        setAccount({ buyingPower: 100000, initialBalance: 100000 });
        setIsOpen(false);
        router.refresh();
      } else {
        toast.error(res.message, { id: tid });
      }
    } catch {
      toast.error('Failed to refill account.', { id: tid });
    } finally {
      setIsRefilling(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary/80 hover:bg-secondary border border-border hover:border-emerald-500/30 transition-all group"
      >
        <div className="bg-emerald-500/10 p-1 rounded-md">
          <Wallet className="w-4 h-4 text-emerald-500" />
        </div>
        <span className="text-sm font-bold font-mono text-foreground hidden md:inline">
          ${account.buyingPower.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-72 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden z-[100]"
          >
            {/* Header */}
            <div className="px-5 pt-5 pb-4 border-b border-border bg-secondary/30">
              <div className="flex items-center gap-2 mb-1">
                <Wallet className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Paper Trading Account</span>
              </div>
              <h3 className="text-3xl font-black text-foreground font-mono tracking-tight">
                ${account.buyingPower.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">Available Buying Power</p>
            </div>

            {/* Stats */}
            <div className="px-5 py-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Starting Balance</span>
                <span className="text-sm font-mono font-medium text-foreground">
                  ${account.initialBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Cash P&L</span>
                <span className={`text-sm font-mono font-bold flex items-center gap-1 ${pnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {pnl >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {pnl >= 0 ? '+' : ''}${pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  <span className="text-xs opacity-70">({pnlPercent.toFixed(1)}%)</span>
                </span>
              </div>
              <div className="h-px bg-border w-full" />
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                This is a simulated brokerage account. No real money is involved. 
                Use it to practice trading strategies risk-free.
              </p>
            </div>

            {/* Actions */}
            <div className="px-5 pb-5">
              <button
                onClick={handleRefill}
                disabled={isRefilling}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 text-orange-500 font-bold text-sm transition-all"
              >
                {isRefilling ? (
                  <RefreshCcw className="w-4 h-4 animate-spin" />
                ) : (
                  <RotateCcw className="w-4 h-4" />
                )}
                {isRefilling ? 'Resetting...' : 'Refill to $100,000'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
