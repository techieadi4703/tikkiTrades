'use client';

import React, { useState, useOptimistic, useTransition, useMemo } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Plus, Trash2, TrendingUp, TrendingDown, Briefcase, Activity } from 'lucide-react';
import { PortfolioHolding, addPortfolioHolding, removePortfolioHolding, getPortfolioHealthAnalysis } from '@/lib/actions/portfolio.actions';
import AddHoldingModal from '@/components/AddHoldingModal';
import PortfolioChart from '@/components/PortfolioChart';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
};

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#14b8a6', '#f43f5e', '#6366f1'];

export default function PortfolioClient({ 
  initialHoldings, 
  initialPaperAccount 
}: { 
  initialHoldings: PortfolioHolding[];
  initialPaperAccount?: any;
}) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [healthAnalysis, setHealthAnalysis] = useState<any>(null);

  // Optimistic UI Hook
  const [optimisticHoldings, addOptimisticHolding] = useOptimistic(
    initialHoldings,
    (state, action: { type: 'add' | 'remove'; payload: any }) => {
      if (action.type === 'add') {
        const optimisticId = `optimistic-${Date.now()}`;
        return [...state, { ...action.payload, _id: optimisticId }];
      }
      if (action.type === 'remove') {
        return state.filter((h) => h._id !== action.payload.id);
      }
      return state;
    }
  );

  const handleAdd = async (data: any) => {
    // Generate an optimistic holding using Finnhub generic math
    const optimisticCost = data.averagePrice * data.shares;
    const newHolding = {
      ...data,
      name: data.symbol,
      currentPrice: data.averagePrice,
      previousClose: data.averagePrice,
      totalValue: optimisticCost,
      totalCost: optimisticCost,
      unrealizedPnL: 0,
      unrealizedPnLPercent: 0,
      dailyChange: 0,
      dailyChangePercent: 0,
    };

    startTransition(() => {
      addOptimisticHolding({ type: 'add', payload: newHolding });
    });

    try {
      await addPortfolioHolding(data);
      toast.success("Holding added", { description: `${data.symbol} has been added to your portfolio.` });
    } catch (e) {
      console.error(e);
    }
  };

  const handleRemove = async (id: string) => {
    startTransition(() => {
      addOptimisticHolding({ type: 'remove', payload: { id } });
    });

    try {
      await removePortfolioHolding(id);
      // window.location.reload();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAnalyzeHealth = async () => {
    if (optimisticHoldings.length === 0) {
      toast.error("Add some holdings first to analyze them!");
      return;
    }
    
    setIsAnalyzing(true);
    let toastId = toast.loading("AI is analyzing your portfolio risk...");
    
    try {
      const res = await getPortfolioHealthAnalysis(optimisticHoldings);
      if (res.success && res.analysis) {
        setHealthAnalysis(res.analysis);
        toast.dismiss(toastId);
        toast.success("Analysis complete!");
      } else {
        toast.dismiss(toastId);
        toast.error(res.message || "Failed to analyze portfolio.");
      }
    } catch (err) {
      toast.dismiss(toastId);
      toast.error("An error occurred during analysis.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Derived Summary Math
  const { totalValue, totalCost, totalDailyChange } = useMemo(() => {
    return optimisticHoldings.reduce(
      (acc, curr) => ({
        totalValue: acc.totalValue + curr.totalValue,
        totalCost: acc.totalCost + curr.totalCost,
        totalDailyChange: acc.totalDailyChange + curr.dailyChange,
      }),
      { totalValue: 0, totalCost: 0, totalDailyChange: 0 }
    );
  }, [optimisticHoldings]);

  const buyingPower = initialPaperAccount ? initialPaperAccount.buyingPower : 0;
  const initialBalance = initialPaperAccount ? initialPaperAccount.initialBalance : 0;
  
  const totalNetWorth = totalValue + buyingPower;
  
  // Adjusted PnL including paper account starting balance
  const totalPnL = initialPaperAccount 
    ? (totalNetWorth - initialBalance) 
    : (totalValue - totalCost);
    
  const totalPnLPercent = initialPaperAccount 
    ? ((totalNetWorth - initialBalance) / initialBalance) * 100 
    : (totalCost > 0 ? (totalPnL / totalCost) * 100 : 0);

  // Chart Data
  const chartData = useMemo(() => {
    return optimisticHoldings
      .filter((h) => h.totalValue > 0)
      .sort((a, b) => b.totalValue - a.totalValue)
      .map((h, i) => ({
        name: h.symbol,
        value: h.totalValue,
        fill: COLORS[i % COLORS.length],
      }));
  }, [optimisticHoldings]);

  return (
    <>
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
        
        {/* Header Action */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
              <Briefcase className="w-8 h-8 text-emerald-500 bg-emerald-500/10 p-1.5 rounded-lg border border-emerald-500/20" />
              Portfolio Tracker
            </h1>
            <p className="text-muted-foreground mt-1 flex items-center gap-2 text-sm">
              <Activity className="w-4 h-4 text-emerald-500" />
              Live market sync active
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleAnalyzeHealth}
              disabled={isAnalyzing || optimisticHoldings.length === 0}
              className="flex items-center justify-center gap-2 bg-violet-500/10 hover:bg-violet-500/20 text-violet-500 border border-violet-500/20 font-semibold px-5 py-2.5 rounded-xl transition-all shadow-sm disabled:opacity-50"
            >
              {isAnalyzing ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                  <Activity className="w-5 h-5" />
                </motion.div>
              ) : (
                <TrendingUp className="w-5 h-5" />
              )}
              {isAnalyzing ? "Analyzing..." : "AI Health Check"}
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-black font-semibold px-5 py-2.5 rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transform hover:-translate-y-0.5"
            >
              <Plus className="w-5 h-5" />
              Add Holding
            </button>
          </div>
        </motion.div>

        {healthAnalysis && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: 'auto' }} 
            className="bg-card border border-violet-500/30 rounded-2xl p-6 shadow-lg relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <TrendingUp className="w-48 h-48 text-violet-500" />
            </div>
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <div className="bg-violet-500/10 p-2.5 rounded-lg text-violet-500">
                <Activity className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">AI Health Profile</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
              <div className="bg-secondary/50 p-4 rounded-xl border border-border flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Alpha Score</p>
                  <p className="text-2xl font-bold text-foreground">{healthAnalysis.alphaScore}<span className="text-sm text-muted-foreground">/100</span></p>
                </div>
                <div className={`text-sm px-3 py-1 rounded-full font-bold ${healthAnalysis.alphaScore > 70 ? 'bg-emerald-500/20 text-emerald-500' : healthAnalysis.alphaScore > 40 ? 'bg-orange-500/20 text-orange-500' : 'bg-red-500/20 text-red-500'}`}>
                  {healthAnalysis.alphaScore > 70 ? 'Strong' : healthAnalysis.alphaScore > 40 ? 'Fair' : 'Weak'}
                </div>
              </div>
              
              <div className="bg-secondary/50 p-4 rounded-xl border border-border">
                <p className="text-sm font-medium text-muted-foreground mb-1">Estimated Beta</p>
                <p className={`text-xl font-bold ${healthAnalysis.estimatedBeta === 'High' ? 'text-red-500' : healthAnalysis.estimatedBeta === 'Low' ? 'text-emerald-500' : 'text-blue-500'}`}>
                  {healthAnalysis.estimatedBeta} Volatility
                </p>
              </div>

              <div className="bg-secondary/50 p-4 rounded-xl border border-border">
                <p className="text-sm font-medium text-muted-foreground mb-1">Diversification</p>
                <p className="text-sm text-foreground line-clamp-2">{healthAnalysis.diversificationRisk}</p>
              </div>
            </div>

            <div className="mt-4 bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl relative z-10 flex gap-4 items-start">
               <div className="shrink-0 mt-1">
                 <Briefcase className="w-5 h-5 text-blue-500" />
               </div>
               <div>
                 <p className="text-sm font-bold text-blue-500 mb-1 uppercase tracking-wider">Actionable Advice</p>
                 <p className="text-foreground font-medium">{healthAnalysis.actionableAdvice}</p>
               </div>
            </div>
          </motion.div>
        )}

        {/* Top Overview Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          {/* Card 1: Total Net Worth */}
          <div className="bg-card border border-border rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-linear-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <p className="text-sm font-medium text-muted-foreground mb-1">Total Net Worth</p>
            <h2 className="text-4xl font-black text-foreground tracking-tight">
              ${totalNetWorth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
          </div>

          {/* Card 2: Cash / Buying Power */}
          <div className="bg-card border border-border rounded-2xl p-6 relative overflow-hidden group">
             <p className="text-sm font-medium text-muted-foreground mb-1">Available Cash (Buying Power)</p>
             <h2 className="text-3xl font-bold tracking-tight text-blue-500">
               ${buyingPower.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
             </h2>
          </div>

          {/* Card 3: Total Unrealized P&L */}
          <div className="bg-card border border-border rounded-2xl p-6 relative overflow-hidden group">
             <p className="text-sm font-medium text-muted-foreground mb-1">Overall P&L</p>
             <div className="flex items-baseline gap-3">
               <h2 className={`text-3xl font-bold tracking-tight ${totalPnL >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                 {totalPnL >= 0 ? '+' : ''}${totalPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
               </h2>
               <span className={`flex items-center text-sm font-semibold px-2 py-0.5 rounded-full ${totalPnLPercent >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                 {totalPnLPercent >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                 {totalPnLPercent.toFixed(2)}%
               </span>
             </div>
          </div>

          {/* Card 4: Invested Value */}
          <div className="bg-card border border-border rounded-2xl p-6 relative overflow-hidden group">
             <p className="text-sm font-medium text-muted-foreground mb-1">Invested in Assets</p>
             <h2 className="text-3xl font-bold tracking-tight text-foreground">
               ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
             </h2>
          </div>
        </motion.div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Table */}
          <motion.div variants={itemVariants} className="lg:col-span-2 bg-card border border-border rounded-2xl overflow-hidden shadow-xl">
             <div className="p-6 border-b border-border bg-secondary/30">
                <h3 className="text-lg font-bold text-foreground tracking-tight">Your Holdings</h3>
             </div>
             
             {optimisticHoldings.length === 0 ? (
               <div className="p-12 text-center flex flex-col items-center justify-center">
                  <div className="w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center mb-4">
                    <Briefcase className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h4 className="text-foreground font-medium text-lg">No assets yet</h4>
                  <p className="text-muted-foreground mb-6 text-sm">Add your first stock, ETF, or crypto to track your wealth.</p>
                  <button onClick={() => setIsModalOpen(true)} className="text-emerald-500 hover:text-emerald-400 font-medium text-sm transition-colors">
                    Click here to add one
                  </button>
               </div>
             ) : (
               <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                   <thead>
                     <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground bg-secondary/30">
                       <th className="px-6 py-4 font-medium">Asset</th>
                       <th className="px-6 py-4 font-medium text-right">Shares</th>
                       <th className="px-6 py-4 font-medium text-right">Cost (Avg)</th>
                       <th className="px-6 py-4 font-medium text-right">Price</th>
                       <th className="px-6 py-4 font-medium text-right">Change</th>
                       <th className="px-6 py-4 font-medium text-right">P&L</th>
                       <th className="px-6 py-4 font-medium text-center">Delete</th>
                     </tr>
                   </thead>
                   <tbody>
                     <AnimatePresence mode="popLayout" initial={false}>
                       {optimisticHoldings.map((h) => (
                         <motion.tr 
                           layout
                           key={h._id}
                           initial={{ opacity: 0, x: 40 }}
                           animate={{ opacity: 1, x: 0 }}
                           exit={{ opacity: 0, x: -40, scale: 0.95 }}
                           transition={{ duration: 0.4, type: 'spring', bounce: 0.3 }}
                           whileHover={{ scale: 1.01, backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
                           onClick={() => router.push(`/stocks/${h.symbol}`)}
                           className="border-b border-border hover:bg-secondary/30 transition-colors cursor-pointer"
                         >
                           <td className="px-6 py-4">
                             <div className="flex flex-col">
                               <span className="text-foreground font-bold tracking-tight">{h.symbol}</span>
                               <span className="text-xs text-muted-foreground truncate max-w-[120px]">{h.name}</span>
                             </div>
                           </td>
                           <td className="px-6 py-4 text-right text-foreground font-mono">{h.shares}</td>
                           <td className="px-6 py-4 text-right">
                             <span className="text-foreground font-mono">${h.averagePrice.toFixed(2)}</span>
                           </td>
                           <td className="px-6 py-4 text-right">
                             <span className="text-foreground font-mono font-medium">${h.currentPrice.toFixed(2)}</span>
                           </td>
                           <td className="px-6 py-4 text-right">
                             <div className="flex flex-col items-end">
                               <span className={`font-mono text-sm ${h.dailyChangePercent >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                 {h.dailyChangePercent > 0 ? '+' : ''}{h.dailyChangePercent.toFixed(2)}%
                               </span>
                             </div>
                           </td>
                           <td className="px-6 py-4 text-right bg-secondary/30">
                             <div className="flex flex-col items-end">
                               <span className={`font-mono font-semibold ${h.unrealizedPnLPercent >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                 {h.unrealizedPnLPercent > 0 ? '+' : ''}{h.unrealizedPnLPercent.toFixed(2)}%
                               </span>
                               <span className="text-xs text-muted-foreground font-mono">
                                 ${Math.abs(h.unrealizedPnL).toFixed(2)}
                               </span>
                             </div>
                           </td>
                           <td className="px-6 py-4 text-center">
                             <button
                               onClick={(e) => {
                                 e.stopPropagation();
                                 handleRemove(h._id);
                               }}
                               className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10 p-2 rounded-lg transition-colors"
                             >
                               <Trash2 className="w-4 h-4" />
                             </button>
                           </td>
                         </motion.tr>
                       ))}
                     </AnimatePresence>
                   </tbody>
                 </table>
               </div>
             )}
          </motion.div>

          {/* Allocation Panel */}
          <motion.div variants={itemVariants} className="bg-card border border-border rounded-2xl p-6 shadow-xl flex flex-col">
            <h3 className="text-lg font-bold text-foreground tracking-tight mb-6">Allocation Base</h3>
            <div className="flex-1 flex items-center justify-center">
               <PortfolioChart data={chartData} />
            </div>
            
            {optimisticHoldings.length > 0 && (
              <div className="mt-6 pt-6 border-t border-border space-y-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                {chartData.map((d, i) => (
                   <div key={`${d.name}-${i}`} className="flex items-center justify-between text-sm">
                     <div className="flex items-center gap-3">
                       <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.fill }} />
                       <span className="text-foreground font-medium">{d.name}</span>
                     </div>
                     <span className="text-muted-foreground font-mono">
                       {((d.value / totalValue) * 100).toFixed(1)}%
                     </span>
                   </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

      </motion.div>

      <AddHoldingModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onAdd={handleAdd} 
        existingSymbols={optimisticHoldings.map(h => h.symbol)}
      />
    </>
  );
}
