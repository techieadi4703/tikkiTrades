'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { BellPlus, Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { createAlert } from '@/lib/actions/alert.actions';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // assuming select exists or we will use regular button group. If select missing, we can fallback to custom buttons. I'll use custom buttons for less dependencies and better Framer Motion integration.

export default function AddAlertModal({ symbol }: { symbol: string }) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [targetPrice, setTargetPrice] = useState('');
  const [condition, setCondition] = useState<'above' | 'below'>('above');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPrice || isNaN(Number(targetPrice))) {
      toast.error('Please enter a valid price');
      return;
    }

    try {
      setIsLoading(true);
      await createAlert({
        ticker: symbol,
        targetPrice: Number(targetPrice),
        condition
      });
      toast.success('Alert created successfully');
      setOpen(false);
      setTargetPrice('');
      router.refresh();
    } catch (error) {
      toast.error('Failed to create alert');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 transition-all gap-2"
        >
          <BellPlus className="w-4 h-4" />
          Add Alert
        </Button>
      </DialogTrigger>
      
      <DialogContent className="bg-[#050505] border-[#222222] text-gray-100 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-100">Create Price Alert for {symbol}</DialogTitle>
          <DialogDescription className="text-gray-400">
            Get notified immediately when {symbol} crosses your target price.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 block">Condition</label>
              <div className="grid grid-cols-2 gap-3">
                <div 
                  onClick={() => setCondition('above')}
                  className={`relative flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer transition-all duration-200 ${condition === 'above' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
                >
                  <TrendingUp className="w-4 h-4" />
                  <span className="font-medium">Price goes Above</span>
                  {condition === 'above' && (
                     <motion.div layoutId="condition-bg" className="absolute inset-0 rounded-xl border border-emerald-500" transition={{ type: 'spring', stiffness: 300, damping: 25 }} />
                  )}
                </div>
                
                <div 
                  onClick={() => setCondition('below')}
                  className={`relative flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer transition-all duration-200 ${condition === 'below' ? 'bg-red-500/10 border-red-500/50 text-red-500' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
                >
                  <TrendingDown className="w-4 h-4" />
                  <span className="font-medium">Price drops Below</span>
                  {condition === 'below' && (
                     <motion.div layoutId="condition-bg" className="absolute inset-0 rounded-xl border border-red-500" transition={{ type: 'spring', stiffness: 300, damping: 25 }} />
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="targetPrice" className="text-sm font-medium text-gray-300 block">Target Price ($)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                <Input
                  id="targetPrice"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="e.g. 150.00"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  className="pl-8 bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus-visible:ring-emerald-500/50 h-12 text-lg rounded-xl"
                  required
                />
              </div>
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={isLoading || !targetPrice}
            className={`w-full h-12 rounded-xl font-semibold text-base transition-all ${condition === 'above' ? 'bg-emerald-500 hover:bg-emerald-600 text-emerald-950' : 'bg-red-500 hover:bg-red-600 text-white'}`}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Create Alert'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
