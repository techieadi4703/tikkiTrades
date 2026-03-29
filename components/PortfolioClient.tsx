'use client';

import React, { useState, useOptimistic, useTransition, useMemo } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Plus, Trash2, TrendingUp, TrendingDown, Briefcase, Activity } from 'lucide-react';
import { PortfolioHolding, addPortfolioHolding, removePortfolioHolding } from '@/lib/actions/portfolio.actions';
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

export default function PortfolioClient({ initialHoldings }: { initialHoldings: PortfolioHolding[] }) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

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

  const totalPnL = totalValue - totalCost;
  const totalPnLPercent = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0;

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
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <Briefcase className="w-8 h-8 text-emerald-500 bg-emerald-500/10 p-1.5 rounded-lg border border-emerald-500/20" />
              Portfolio Tracker
            </h1>
            <p className="text-gray-400 mt-1 flex items-center gap-2 text-sm">
              <Activity className="w-4 h-4 text-emerald-500" />
              Live market sync active
            </p>
          </div>
          
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-black font-semibold px-5 py-2.5 rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transform hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5" />
            Add Holding
          </button>
        </motion.div>

        {/* Top Overview Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Total Value */}
          <div className="bg-[#0F0F0F] border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <p className="text-sm font-medium text-gray-400 mb-1">Total Portfolio Value</p>
            <h2 className="text-4xl font-black text-white tracking-tight">
              ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
          </div>

          {/* Card 2: Total Unrealized P&L */}
          <div className="bg-[#0F0F0F] border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
             <p className="text-sm font-medium text-gray-400 mb-1">Overall P&L (Unrealized)</p>
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

          {/* Card 3: Today's Return */}
          <div className="bg-[#0F0F0F] border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
             <p className="text-sm font-medium text-gray-400 mb-1">Today's Profit / Loss</p>
             <h2 className={`text-3xl font-bold tracking-tight ${totalDailyChange >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
               {totalDailyChange >= 0 ? '+' : ''}${totalDailyChange.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
             </h2>
          </div>
        </motion.div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Table */}
          <motion.div variants={itemVariants} className="lg:col-span-2 bg-[#0F0F0F] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
             <div className="p-6 border-b border-white/5 bg-white/[0.02]">
                <h3 className="text-lg font-bold text-white tracking-tight">Your Holdings</h3>
             </div>
             
             {optimisticHoldings.length === 0 ? (
               <div className="p-12 text-center flex flex-col items-center justify-center">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                    <Briefcase className="w-8 h-8 text-gray-500" />
                  </div>
                  <h4 className="text-white font-medium text-lg">No assets yet</h4>
                  <p className="text-gray-500 mb-6 text-sm">Add your first stock, ETF, or crypto to track your wealth.</p>
                  <button onClick={() => setIsModalOpen(true)} className="text-emerald-500 hover:text-emerald-400 font-medium text-sm transition-colors">
                    Click here to add one
                  </button>
               </div>
             ) : (
               <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                   <thead>
                     <tr className="border-b border-white/5 text-xs uppercase tracking-wider text-gray-500 bg-white/[0.01]">
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
                           className="border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer"
                         >
                           <td className="px-6 py-4">
                             <div className="flex flex-col">
                               <span className="text-white font-bold tracking-tight">{h.symbol}</span>
                               <span className="text-xs text-gray-500 truncate max-w-[120px]">{h.name}</span>
                             </div>
                           </td>
                           <td className="px-6 py-4 text-right text-gray-300 font-mono">{h.shares}</td>
                           <td className="px-6 py-4 text-right">
                             <span className="text-gray-300 font-mono">${h.averagePrice.toFixed(2)}</span>
                           </td>
                           <td className="px-6 py-4 text-right">
                             <span className="text-white font-mono font-medium">${h.currentPrice.toFixed(2)}</span>
                           </td>
                           <td className="px-6 py-4 text-right">
                             <div className="flex flex-col items-end">
                               <span className={`font-mono text-sm ${h.dailyChangePercent >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                 {h.dailyChangePercent > 0 ? '+' : ''}{h.dailyChangePercent.toFixed(2)}%
                               </span>
                             </div>
                           </td>
                           <td className="px-6 py-4 text-right bg-white/[0.01]">
                             <div className="flex flex-col items-end">
                               <span className={`font-mono font-semibold ${h.unrealizedPnLPercent >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                 {h.unrealizedPnLPercent > 0 ? '+' : ''}{h.unrealizedPnLPercent.toFixed(2)}%
                               </span>
                               <span className="text-xs text-gray-500 font-mono">
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
                               className="text-gray-500 hover:text-red-500 hover:bg-red-500/10 p-2 rounded-lg transition-colors"
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
          <motion.div variants={itemVariants} className="bg-[#0F0F0F] border border-white/5 rounded-2xl p-6 shadow-xl flex flex-col">
            <h3 className="text-lg font-bold text-white tracking-tight mb-6">Allocation Base</h3>
            <div className="flex-1 flex items-center justify-center">
               <PortfolioChart data={chartData} />
            </div>
            
            {optimisticHoldings.length > 0 && (
              <div className="mt-6 pt-6 border-t border-white/5 space-y-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                {chartData.map((d, i) => (
                   <div key={`${d.name}-${i}`} className="flex items-center justify-between text-sm">
                     <div className="flex items-center gap-3">
                       <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.fill }} />
                       <span className="text-gray-300 font-medium">{d.name}</span>
                     </div>
                     <span className="text-gray-500 font-mono">
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
