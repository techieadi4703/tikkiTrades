'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { runBacktest, BacktestResult } from '@/lib/actions/backtest.actions';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, Legend } from 'recharts';
import { Play, TrendingUp, TrendingDown, RefreshCcw, Activity, Info, Calendar } from 'lucide-react';
import { toast } from 'sonner';

export default function BacktestClient() {
  const [ticker, setTicker] = useState('AAPL');
  const [strategy, setStrategy] = useState<'SMA_CROSSOVER' | 'RSI_REVERSION'>('SMA_CROSSOVER');
  const [years, setYears] = useState<number>(2);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BacktestResult | null>(null);

  const handleRun = async () => {
    if (!ticker.trim()) {
      toast.error("Please enter a valid ticker symbol");
      return;
    }
    setLoading(true);
    let tid = toast.loading(`Running ${strategy} on ${ticker}...`);
    try {
      const data = await runBacktest(ticker.toUpperCase(), strategy, 10000, years);
      setResult(data);
      toast.dismiss(tid);
      toast.success("Simulation Complete!");
    } catch (error: any) {
      toast.dismiss(tid);
      toast.error(error.message || "Failed to run simulation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-border pb-6">
        <div className="bg-blue-500/10 p-3 rounded-xl border border-blue-500/20">
          <Activity className="w-8 h-8 text-blue-500" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Algorithmic Backtester</h1>
          <p className="text-muted-foreground text-sm">Simulate quantitative trading strategies against historical market data.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Sidebar Control Panel */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-lg h-fit space-y-6">
          <h3 className="font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" /> Strategy Config
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Asset Ticker</label>
              <input 
                value={ticker} 
                onChange={e => setTicker(e.target.value.toUpperCase())}
                className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground focus:ring-1 focus:ring-blue-500 outline-none font-mono"
                placeholder="AAPL, NVDA, SPY..."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Algorithm</label>
              <select 
                value={strategy}
                onChange={(e) => setStrategy(e.target.value as any)}
                className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground focus:ring-1 focus:ring-blue-500 outline-none"
              >
                <option value="SMA_CROSSOVER">50/200 Day SMA Crossover</option>
                <option value="RSI_REVERSION">14-Day RSI Mean Reversion</option>
              </select>
              <p className="text-xs text-muted-foreground mt-2 flex gap-1">
                <Info className="w-3 h-3 mt-0.5 shrink-0" />
                {strategy === 'SMA_CROSSOVER' 
                  ? "Buys when 50-day average crosses above 200-day average. Sells when it crosses below."
                  : "Buys when RSI drops below 30 (oversold). Sells when RSI rises above 70 (overbought)."
                }
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Time Horizon</label>
              <div className="flex gap-2">
                {[1, 2, 5, 10].map(y => (
                  <button
                    key={y}
                    onClick={() => setYears(y)}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-all ${years === y ? 'bg-blue-500/20 border-blue-500 text-blue-500' : 'bg-secondary border-border text-muted-foreground hover:bg-secondary/80'}`}
                  >
                    {y}Y
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleRun}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 mt-4"
            >
              {loading ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
              {loading ? "Simulating..." : "Run Backtest"}
            </button>
          </div>
        </div>

        {/* Main Display */}
        <div className="lg:col-span-3 space-y-6">
          {!result ? (
            <div className="bg-card border border-border rounded-2xl p-12 flex flex-col items-center justify-center text-center h-[500px]">
              <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4">
                <Activity className="w-8 h-8 text-blue-500 opacity-50" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">Ready to Simulate</h2>
              <p className="text-muted-foreground max-w-sm">
                Configure your algorithmic strategy on the left and run a backtest to see how it would have performed against the market.
              </p>
            </div>
          ) : (
            <>
              {/* Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-card border border-border p-5 rounded-2xl relative overflow-hidden group">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Strategy Return</p>
                  <h3 className={`text-3xl font-black ${result.stats.totalReturn >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {result.stats.totalReturn >= 0 ? '+' : ''}{result.stats.totalReturn.toFixed(2)}%
                  </h3>
                  <p className="text-sm font-medium text-muted-foreground mt-1">
                    Ending: ${result.stats.finalCapital.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                </div>
                
                <div className="bg-card border border-border p-5 rounded-2xl">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Buy & Hold (Benchmark)</p>
                  <h3 className={`text-2xl font-bold ${result.stats.benchmarkReturn >= 0 ? 'text-foreground' : 'text-red-500'}`}>
                    {result.stats.benchmarkReturn >= 0 ? '+' : ''}{result.stats.benchmarkReturn.toFixed(2)}%
                  </h3>
                  <div className="mt-2 text-xs font-bold">
                    {result.stats.totalReturn > result.stats.benchmarkReturn ? (
                      <span className="text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">Beat Market</span>
                    ) : (
                      <span className="text-red-500 bg-red-500/10 px-2 py-0.5 rounded">Underperformed</span>
                    )}
                  </div>
                </div>

                <div className="bg-card border border-border p-5 rounded-2xl">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Win Rate</p>
                  <h3 className="text-2xl font-bold text-blue-500">
                    {result.stats.winRate.toFixed(1)}%
                  </h3>
                  <p className="text-sm font-medium text-muted-foreground mt-1">
                    {result.stats.totalTrades} Total Trades
                  </p>
                </div>

                <div className="bg-card border border-border p-5 rounded-2xl">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Max Drawdown</p>
                  <h3 className="text-2xl font-bold text-orange-500">
                    -{result.stats.maxDrawdown.toFixed(2)}%
                  </h3>
                  <p className="text-sm font-medium text-muted-foreground mt-1">
                    Risk measurement
                  </p>
                </div>
              </div>

              {/* Chart */}
              <div className="bg-card border border-border rounded-2xl p-6 shadow-lg h-[400px]">
                <h3 className="font-bold text-foreground mb-4">Equity Curve vs Benchmark</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={result.equityCurve}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.2} vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      stroke="#888888" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false}
                      minTickGap={30}
                    />
                    <YAxis 
                      stroke="#888888" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(value) => `$${value.toLocaleString()}`}
                      domain={['auto', 'auto']}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid #333', borderRadius: '8px' }}
                      itemStyle={{ fontWeight: 'bold' }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="equity" name="Strategy Equity" stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="benchmark" name="Buy & Hold" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Trade Log */}
              <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-lg">
                <div className="p-4 border-b border-border bg-secondary/30 flex items-center justify-between">
                  <h3 className="font-bold text-foreground">Trade Execution Log</h3>
                  <span className="text-xs font-mono text-muted-foreground">Showing newest first</span>
                </div>
                <div className="overflow-x-auto max-h-[300px] overflow-y-auto custom-scrollbar">
                  {result.trades.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      No trades were executed by this strategy in the given timeframe.
                    </div>
                  ) : (
                    <table className="w-full text-left">
                      <thead className="sticky top-0 bg-card z-10 border-b border-border">
                        <tr className="text-xs uppercase tracking-wider text-muted-foreground">
                          <th className="px-6 py-3 font-medium">Date</th>
                          <th className="px-6 py-3 font-medium">Action</th>
                          <th className="px-6 py-3 font-medium text-right">Price</th>
                          <th className="px-6 py-3 font-medium text-right">Shares</th>
                          <th className="px-6 py-3 font-medium text-right">Trade P&L</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.trades.map((trade, i) => (
                          <tr key={i} className="border-b border-border/50 hover:bg-secondary/30">
                            <td className="px-6 py-3">
                              <div className="flex items-center gap-2 text-sm text-foreground">
                                <Calendar className="w-3 h-3 text-muted-foreground" />
                                {trade.date}
                              </div>
                            </td>
                            <td className="px-6 py-3">
                              <span className={`text-xs font-bold px-2 py-1 rounded ${trade.type === 'BUY' ? 'bg-blue-500/20 text-blue-500' : 'bg-orange-500/20 text-orange-500'}`}>
                                {trade.type}
                              </span>
                            </td>
                            <td className="px-6 py-3 text-right font-mono text-sm text-foreground">
                              ${trade.price.toFixed(2)}
                            </td>
                            <td className="px-6 py-3 text-right font-mono text-sm text-foreground">
                              {trade.shares.toFixed(4)}
                            </td>
                            <td className="px-6 py-3 text-right font-mono text-sm">
                              {trade.pnl !== undefined ? (
                                <span className={trade.pnl >= 0 ? 'text-emerald-500' : 'text-red-500'}>
                                  {trade.pnl > 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                                </span>
                              ) : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

            </>
          )}
        </div>
      </div>
    </div>
  );
}
