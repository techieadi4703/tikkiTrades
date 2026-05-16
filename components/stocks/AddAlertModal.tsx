'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { BellPlus, Loader2, TrendingUp, TrendingDown, Activity, Brain, BarChart3 } from 'lucide-react';
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

type AlertType = 'price' | 'volume_spike' | 'sentiment_shift';

const ALERT_TYPES = [
  { type: 'price' as AlertType, icon: BarChart3, label: 'Price Alert', desc: 'Trigger on price targets', color: 'emerald' },
  { type: 'volume_spike' as AlertType, icon: Activity, label: 'Volume Spike', desc: 'Unusual trading volume', color: 'amber' },
  { type: 'sentiment_shift' as AlertType, icon: Brain, label: 'Sentiment Shift', desc: 'AI-detected mood changes', color: 'violet' },
];

export default function AddAlertModal({ symbol }: { symbol: string }) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [alertType, setAlertType] = useState<AlertType>('price');
  const [targetPrice, setTargetPrice] = useState('');
  const [condition, setCondition] = useState<'above' | 'below'>('above');
  const [volumeThreshold, setVolumeThreshold] = useState('2.0');
  const [sentimentDirection, setSentimentDirection] = useState<'bullish' | 'bearish'>('bearish');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (alertType === 'price' && (!targetPrice || isNaN(Number(targetPrice)))) {
      toast.error('Please enter a valid price');
      return;
    }

    try {
      setIsLoading(true);
      await createAlert({
        ticker: symbol,
        alertType,
        targetPrice: alertType === 'price' ? Number(targetPrice) : undefined,
        condition: alertType === 'price' ? condition : undefined,
        volumeThreshold: alertType === 'volume_spike' ? Number(volumeThreshold) : undefined,
        sentimentDirection: alertType === 'sentiment_shift' ? sentimentDirection : undefined,
      });

      const typeLabel = alertType === 'price' ? 'Price alert' : alertType === 'volume_spike' ? 'Volume spike alert' : 'Sentiment alert';
      toast.success(`${typeLabel} created for ${symbol}`);
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

  const getColor = (type: AlertType) => {
    if (type === 'price') return { active: 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500', inactive: 'bg-secondary/50 border-border text-muted-foreground hover:bg-secondary/80' };
    if (type === 'volume_spike') return { active: 'bg-amber-500/10 border-amber-500/50 text-amber-500', inactive: 'bg-secondary/50 border-border text-muted-foreground hover:bg-secondary/80' };
    return { active: 'bg-violet-500/10 border-violet-500/50 text-violet-500', inactive: 'bg-secondary/50 border-border text-muted-foreground hover:bg-secondary/80' };
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
      
      <DialogContent className="bg-background border-border text-foreground sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground">Smart Alerts for {symbol}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Choose an alert type — from traditional price targets to AI-powered smart alerts.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {/* Alert Type Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground block">Alert Type</label>
            <div className="grid grid-cols-3 gap-2">
              {ALERT_TYPES.map((at) => {
                const colors = getColor(at.type);
                const isActive = alertType === at.type;
                return (
                  <button
                    key={at.type}
                    type="button"
                    onClick={() => setAlertType(at.type)}
                    className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border cursor-pointer transition-all duration-200 ${isActive ? colors.active : colors.inactive}`}
                  >
                    <at.icon className="w-5 h-5" />
                    <span className="text-[11px] font-bold">{at.label}</span>
                    <span className="text-[9px] opacity-60">{at.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Conditional Fields */}
          <AnimatePresence mode="wait">
            {alertType === 'price' && (
              <motion.div
                key="price"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground block">Condition</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div 
                      onClick={() => setCondition('above')}
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${condition === 'above' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500' : 'bg-secondary/50 border-border text-muted-foreground hover:bg-secondary/80'}`}
                    >
                      <TrendingUp className="w-4 h-4" />
                      <span className="font-medium text-sm">Goes Above</span>
                    </div>
                    <div 
                      onClick={() => setCondition('below')}
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${condition === 'below' ? 'bg-red-500/10 border-red-500/50 text-red-500' : 'bg-secondary/50 border-border text-muted-foreground hover:bg-secondary/80'}`}
                    >
                      <TrendingDown className="w-4 h-4" />
                      <span className="font-medium text-sm">Drops Below</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground block">Target Price ($)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">$</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="150.00"
                      value={targetPrice}
                      onChange={(e) => setTargetPrice(e.target.value)}
                      className="pl-8 bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-emerald-500/50 h-12 text-lg rounded-xl"
                      required
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {alertType === 'volume_spike' && (
              <motion.div
                key="volume"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-4"
              >
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
                  <p className="text-sm text-amber-500 font-medium mb-1 flex items-center gap-2">
                    <Activity className="w-4 h-4" /> How it works
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    You'll be notified when {symbol}'s trading volume exceeds the threshold you set (as a multiplier of the average daily volume). A value of 2x means double the average volume.
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground block">Volume Multiplier</label>
                  <div className="flex items-center gap-3">
                    {['1.5', '2.0', '3.0', '5.0'].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setVolumeThreshold(val)}
                        className={`flex-1 py-2.5 rounded-xl border text-sm font-bold transition-all ${volumeThreshold === val ? 'bg-amber-500/10 border-amber-500/50 text-amber-500' : 'bg-secondary/50 border-border text-muted-foreground hover:bg-secondary/80'}`}
                      >
                        {val}x
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {alertType === 'sentiment_shift' && (
              <motion.div
                key="sentiment"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-4"
              >
                <div className="bg-violet-500/5 border border-violet-500/20 rounded-xl p-4">
                  <p className="text-sm text-violet-500 font-medium mb-1 flex items-center gap-2">
                    <Brain className="w-4 h-4" /> AI-Powered
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Our AI monitors news headlines and market sentiment for {symbol}. Get notified when there's a significant shift in overall market mood towards your chosen direction.
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground block">Alert me when sentiment turns...</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setSentimentDirection('bearish')}
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${sentimentDirection === 'bearish' ? 'bg-red-500/10 border-red-500/50 text-red-500' : 'bg-secondary/50 border-border text-muted-foreground hover:bg-secondary/80'}`}
                    >
                      <TrendingDown className="w-4 h-4" />
                      <span className="font-medium text-sm">Bearish</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSentimentDirection('bullish')}
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${sentimentDirection === 'bullish' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500' : 'bg-secondary/50 border-border text-muted-foreground hover:bg-secondary/80'}`}
                    >
                      <TrendingUp className="w-4 h-4" />
                      <span className="font-medium text-sm">Bullish</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit */}
          <Button 
            type="submit" 
            disabled={isLoading || (alertType === 'price' && !targetPrice)}
            className={`w-full h-12 rounded-xl font-semibold text-base transition-all ${
              alertType === 'price' 
                ? (condition === 'above' ? 'bg-emerald-500 hover:bg-emerald-600 text-emerald-950' : 'bg-red-500 hover:bg-red-600 text-white')
                : alertType === 'volume_spike'
                ? 'bg-amber-500 hover:bg-amber-600 text-amber-950'
                : 'bg-violet-500 hover:bg-violet-600 text-white'
            }`}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Create Smart Alert'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
