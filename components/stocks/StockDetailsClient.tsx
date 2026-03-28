"use client";

import React from "react";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import TradingViewWidget from "@/components/TradingViewWidget";
import WatchlistButton from "@/components/WatchlistButton";
import {
  SYMBOL_INFO_WIDGET_CONFIG,
  CANDLE_CHART_WIDGET_CONFIG,
  BASELINE_WIDGET_CONFIG,
  TECHNICAL_ANALYSIS_WIDGET_CONFIG,
  COMPANY_PROFILE_WIDGET_CONFIG,
  COMPANY_FINANCIALS_WIDGET_CONFIG,
} from "@/lib/constants";

interface StockDetailsClientProps {
  symbol: string;
  upper: string;
  companyName: string;
  alreadyInWatchlist: boolean;
}

export default function StockDetailsClient({
  symbol,
  upper,
  companyName,
  alreadyInWatchlist,
}: StockDetailsClientProps) {
  const scriptUrl = `https://s3.tradingview.com/external-embedding/embed-widget-`;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 md:p-8 max-w-[1600px] mx-auto"
    >
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center gap-4 mb-8"
      >
        <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
          <TrendingUp className="w-6 h-6 text-emerald-500" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">{upper}</h1>
          <p className="text-gray-500 text-sm font-medium">{companyName}</p>
        </div>
      </motion.div>

      <motion.section 
        className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full"
      >
        {/* Left column */}
        <div className="flex flex-col gap-8">
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden shadow-2xl p-1"
          >
            <TradingViewWidget
              scriptUrl={`${scriptUrl}symbol-info.js`}
              config={SYMBOL_INFO_WIDGET_CONFIG(symbol)}
              height={170}
            />
          </motion.div>

          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden shadow-2xl p-1"
          >
            <TradingViewWidget
              scriptUrl={`${scriptUrl}advanced-chart.js`}
              config={CANDLE_CHART_WIDGET_CONFIG(symbol)}
              className="custom-chart"
              height={600}
            />
          </motion.div>

          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden shadow-2xl p-1"
          >
            <TradingViewWidget
              scriptUrl={`${scriptUrl}advanced-chart.js`}
              config={BASELINE_WIDGET_CONFIG(symbol)}
              className="custom-chart"
              height={600}
            />
          </motion.div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-8">
          <motion.div 
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex items-center justify-between"
          >
            <WatchlistButton symbol={symbol.toUpperCase()} company={companyName} isInWatchlist={alreadyInWatchlist} />
          </motion.div>

          {[
            { tag: 'technical-analysis.js', config: TECHNICAL_ANALYSIS_WIDGET_CONFIG(symbol), h: 400, d: 0.2 },
            { tag: 'company-profile.js', config: COMPANY_PROFILE_WIDGET_CONFIG(symbol), h: 440, d: 0.3 },
            { tag: 'financials.js', config: COMPANY_FINANCIALS_WIDGET_CONFIG(symbol), h: 464, d: 0.4 },
          ].map((item, i) => (
            <motion.div 
              key={item.tag}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: item.d }}
              className="bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden shadow-2xl p-1"
            >
              <TradingViewWidget
                scriptUrl={`${scriptUrl}${item.tag}`}
                config={item.config}
                height={item.h}
              />
            </motion.div>
          ))}
        </div>
      </motion.section>
    </motion.div>
  );
}
