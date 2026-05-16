"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import TradingViewWidget from "@/components/TradingViewWidget";
import WatchlistButton from "@/components/WatchlistButton";
import AddAlertModal from "@/components/stocks/AddAlertModal";
import TradeTicket from "@/components/stocks/TradeTicket";
import SentinelScoreClient from "@/components/stocks/SentinelScoreClient";
import { SentinelScore } from "@/database/models/newsCache.model";
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
  newsFeedNode?: React.ReactNode;
  sentinelScoreData?: SentinelScore;
}

export default function StockDetailsClient({
  symbol,
  upper,
  companyName,
  alreadyInWatchlist,
  newsFeedNode,
  sentinelScoreData,
}: StockDetailsClientProps) {
  const scriptUrl = `https://s3.tradingview.com/external-embedding/embed-widget-`;
  const [isSentinelOpen, setIsSentinelOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 md:p-8 max-w-[1700px] mx-auto"
    >
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
      >
        <div className="flex items-center gap-4">
          <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
            <TrendingUp className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">
              {upper}
            </h1>
            <p className="text-muted-foreground text-sm font-medium">{companyName}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <AddAlertModal symbol={symbol.toUpperCase()} />
          <WatchlistButton
            symbol={symbol.toUpperCase()}
            company={companyName}
            isInWatchlist={alreadyInWatchlist}
          />
        </div>
      </motion.div>

      {/* Main Dashboard Grid */}
      <motion.section className="grid grid-cols-1 xl:grid-cols-3 gap-8 w-full">
        {/* Left column (Chart + Overview) */}
        <div className="xl:col-span-2 flex flex-col gap-8 overflow-visible">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-secondary/50 backdrop-blur-xl border border-border rounded-2xl overflow-hidden shadow-2xl p-1"
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
            className="bg-secondary/50 backdrop-blur-xl border border-border rounded-2xl overflow-hidden shadow-2xl p-1"
          >
            <TradingViewWidget
              scriptUrl={`${scriptUrl}advanced-chart.js`}
              config={CANDLE_CHART_WIDGET_CONFIG(symbol)}
              className="custom-chart"
              height={640}
            />
          </motion.div>

          {/* News Feed — expands to full width when sentinel closed */}
          {newsFeedNode && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ 
                y: 0, 
                opacity: 1,
                width: isSentinelOpen ? '100%' : 'calc(150% + 2rem)',
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="flex flex-col"
            >
              <div className="flex items-center gap-3 mb-6 shrink-0">
                <div className="h-8 w-1 bg-emerald-500 rounded-full"></div>
                <h2 className="text-xl xl:text-2xl font-bold text-foreground tracking-tight">
                  Latest News & Sentiment
                </h2>
              </div>
              {newsFeedNode}
            </motion.div>
          )}
        </div>

        {/* Right column (Trade Ticket + Sentinel Score) */}
        <div className="xl:col-span-1 flex flex-col gap-8 w-full">
          {/* Trade Ticket */}
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <TradeTicket symbol={symbol.toUpperCase()} />
          </motion.div>

          {sentinelScoreData && (
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="w-full h-fit flex flex-col"
            >
              <SentinelScoreClient scoreData={sentinelScoreData} onToggle={setIsSentinelOpen} />
            </motion.div>
          )}
        </div>
      </motion.section>

      {/* Deep Dive Metrics (Moved directly beneath Top Dashboard) */}
      <motion.section
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full mt-8 items-start"
      >
        {[
          { tag: 'technical-analysis.js', config: TECHNICAL_ANALYSIS_WIDGET_CONFIG(symbol), h: 464, d: 0.1 },
          { tag: 'financials.js', config: COMPANY_FINANCIALS_WIDGET_CONFIG(symbol), h: 464, d: 0.2 },
        ].map((item, i) => (
          <motion.div 
            key={item.tag}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: item.d + 0.4 }}
            className="bg-secondary/50 backdrop-blur-xl border border-border rounded-2xl overflow-hidden shadow-2xl p-1 w-full"
          >
            <TradingViewWidget
              scriptUrl={`${scriptUrl}${item.tag}`}
              config={item.config}
              height={item.h}
            />
          </motion.div>
        ))}
      </motion.section>

      {/* Below the Fold: Full Width Baseline Chart */}
      <motion.section 
        className="flex flex-col gap-8 w-full mt-8"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-secondary/50 backdrop-blur-xl border border-border rounded-2xl overflow-hidden shadow-2xl p-1 w-full"
        >
          <TradingViewWidget
            scriptUrl={`${scriptUrl}advanced-chart.js`}
            config={BASELINE_WIDGET_CONFIG(symbol)}
            height={464}
          />
        </motion.div>
      </motion.section>
    </motion.div>
  );
}
