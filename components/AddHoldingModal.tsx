'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Loader2 } from 'lucide-react';
import { searchStocks } from '@/lib/actions/finnhub.actions';
import { toast } from 'sonner';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: { symbol: string; shares: number; averagePrice: number; datePurchased: Date }) => Promise<void>;
  existingSymbols: string[];
}

// Basic debounce hook if useDebounce isn't exported globally
function useLocalDebounce(callback: () => void, delay: number) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  return () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      callback();
    }, delay);
  };
}

export default function AddHoldingModal({ isOpen, onClose, onAdd, existingSymbols }: Props) {
  const [symbol, setSymbol] = useState('');
  const [shares, setShares] = useState('');
  const [averagePrice, setAveragePrice] = useState('');
  const [datePurchased, setDatePurchased] = useState(new Date().toISOString().split('T')[0]);
  
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const performSearch = async () => {
    if (!symbol.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const results = await searchStocks(symbol.trim());
      setSearchResults(results || []);
    } catch (e) {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const debouncedSearch = useLocalDebounce(performSearch, 300);

  useEffect(() => {
    debouncedSearch();
  }, [symbol]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol || !shares || !averagePrice || !datePurchased) return;
    
    // Verify if stock is valid by checking our searchResults or doing a forced strict check
    const upperSymbol = symbol.toUpperCase().trim();
    // Check for duplicate holdings
    if (existingSymbols.includes(upperSymbol)) {
      toast.error("Duplicate Asset", { description: "You already have this asset in your portfolio. You currently cannot average down; delete and re-add to update."});
      return;
    }

    if (searchResults.length > 0) {
      const isValid = searchResults.some(r => r.symbol === upperSymbol);
      if (!isValid) {
         toast.error("Invalid Ticker", { description: "Please select a valid stock ticker from the list."});
         return;
      }
    } else if (!isSearching) {
        // If results are completely empty and we aren't searching, it's a random string
        toast.error("Invalid Ticker", { description: "Could not find this stock. Try searching again."});
        return;
    }

    // Close immediately to let the Optimistic UI run the animation
    onClose();
    
    // Fire the onAdd without awaiting it to avoid freezing the modal open
    onAdd({
      symbol: upperSymbol,
      shares: Number(shares),
      averagePrice: Number(averagePrice),
      datePurchased: new Date(datePurchased),
    });
    
    // Reset state for next open
    setSymbol('');
    setShares('');
    setAveragePrice('');
    setDatePurchased(new Date().toISOString().split('T')[0]);
    setSearchResults([]);
    setShowDropdown(false);
  };

  const handleSelectTicker = (selectedSymbol: string) => {
      setSymbol(selectedSymbol);
      setShowDropdown(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="bg-[#0F0F0F] border border-white/5 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative"
          >
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <h2 className="text-xl font-bold text-white tracking-tight">Add Portfolio Holding</h2>
              <button 
                onClick={() => {
                  setSymbol('');
                  setSearchResults([]);
                  onClose();
                }} 
                className="text-gray-400 hover:text-white transition-colors bg-white/5 p-2 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2 relative">
                <label className="text-sm font-medium text-gray-400">Ticker Symbol</label>
                <div className="relative flex items-center">
                    <Search className="w-4 h-4 text-emerald-500 absolute left-3"/>
                    <input
                        type="text"
                        required
                        placeholder="Search stock (e.g. AAPL)"
                        value={symbol}
                        onFocus={() => setShowDropdown(true)}
                        onChange={(e) => {
                            setSymbol(e.target.value);
                            setShowDropdown(true);
                        }}
                        className="w-full bg-[#1A1A1A] border border-white/5 rounded-xl py-3 pl-10 pr-10 text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500/50 transition-colors uppercase"
                    />
                    {isSearching && (
                        <Loader2 className="w-4 h-4 text-emerald-500 absolute right-3 animate-spin"/>
                    )}
                </div>
                
                {/* Search Dropdown */}
                {showDropdown && symbol.trim() && !isSearching && searchResults.length > 0 && (
                   <div className="absolute top-full left-0 right-0 mt-2 bg-[#1A1A1A] border border-white/10 rounded-xl shadow-2xl max-h-48 overflow-y-auto z-50 p-1 flex flex-col gap-1 custom-scrollbar">
                      {searchResults.map((res) => (
                         <div 
                           key={res.symbol}
                           onClick={() => handleSelectTicker(res.symbol)}
                           className="flex flex-col px-3 py-2 cursor-pointer rounded-lg hover:bg-emerald-500/10 transition-colors"
                         >
                            <span className="text-white font-bold">{res.symbol}</span>
                            <span className="text-xs text-gray-500 truncate">{res.name}</span>
                         </div>
                      ))}
                   </div>
                )}
                {showDropdown && symbol.trim() && !isSearching && searchResults.length === 0 && (
                   <div className="absolute top-full left-0 right-0 mt-2 bg-[#1A1A1A] border border-white/10 rounded-xl shadow-2xl p-4 z-50 flex items-center justify-center text-sm text-gray-500">
                      No matching stocks found
                   </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-400">Shares Owned</label>
                    <input
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    placeholder="10"
                    value={shares}
                    onChange={(e) => setShares(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-white/5 rounded-xl py-3 px-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-400">Avg. Cost ($)</label>
                    <input
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    placeholder="150.00"
                    value={averagePrice}
                    onChange={(e) => setAveragePrice(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-white/5 rounded-xl py-3 px-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
                    />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Date Purchased</label>
                <input
                  type="date"
                  required
                  value={datePurchased}
                  onChange={(e) => setDatePurchased(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-white/5 rounded-xl py-3 px-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
                  style={{ colorScheme: 'dark' }}
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading || (symbol.trim() !== '' && searchResults.length === 0 && !isSearching)}
                  className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 rounded-xl py-3 font-medium transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add Holding'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
