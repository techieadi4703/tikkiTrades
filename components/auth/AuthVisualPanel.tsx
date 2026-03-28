"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import LiveChart, { MarketCard } from "./LiveChart";

const TESTIMONIALS = [
  {
    name: "Ethan R.",
    role: "Retail Investor",
    quote: "Tikki Trades turned my watchlist into a winning list. The alerts are spot-on, and I feel more confident making moves.",
    color: "from-green-500 to-emerald-400"
  },
  {
    name: "Sarah M.",
    role: "Day Trader",
    quote: "The real-time alerts are a game changer for my strategy. I've never felt more in control of my portfolio.",
    color: "from-purple-500 to-indigo-400"
  },
  {
    name: "David K.",
    role: "Crypto Enthusiast",
    quote: "Finally a platform that makes complex charts look simple and beautiful. The UX is simply unmatched.",
    color: "from-blue-500 to-cyan-400"
  },
  {
    name: "Lila S.",
    role: "Portfolio Manager",
    quote: "Precision and speed. TikkiTrades is now my primary analysis tool for daily market entries.",
    color: "from-emerald-500 to-teal-400"
  }
];

const TRADES = [
  { symbol: "BTC/USDT", price: "$64,321.40", change: "+2.4%", trend: "up" as const, color: "#22c55e" },
  { symbol: "AAPL", price: "$189.24", change: "-0.85%", trend: "down" as const, color: "#ef4444" },
  { symbol: "TSLA", price: "$175.50", change: "+1.2%", trend: "neutral" as const, color: "#06b6d4" },
];

const AuthVisualPanel = () => {
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const [activeTradeIndex, setActiveTradeIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTestimonialIndex((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const activeTrade = TRADES[activeTradeIndex];
  const testimonial = TESTIMONIALS[testimonialIndex];

  return (
    <section className="hidden lg:flex flex-col gap-6 pl-8 h-full justify-center max-h-full overflow-hidden">
      <div className="space-y-2">
        <h2 className="text-3xl lg:text-4xl font-bold text-white leading-tight">
          Trade with <span className="text-green-400">Confidence</span>,
          <br />
          Analyze with <span className="text-emerald-400">Precision.</span>
        </h2>
        <p className="text-gray-400 text-sm max-w-md">
          Join thousands of traders using TikkiTrades to transform their market insights into winning strategies.
        </p>
      </div>

      <div className="space-y-4">
        <div className="bg-black/40 backdrop-blur-md border border-white/10 p-4 rounded-xl space-y-3 shadow-xl">
          <div className="flex justify-between items-center text-gray-400">
            <div className="flex flex-col">
               <span className="text-[10px] font-medium uppercase tracking-widest opacity-60">Market Analysis</span>
               <span className="text-sm text-white font-bold">{activeTrade.symbol}</span>
            </div>
            <span className="flex items-center gap-2 bg-black/60 px-2 py-0.5 rounded-full border border-white/5">
              <span className={`w-1.5 h-1.5 rounded-full animate-pulse`} style={{ backgroundColor: activeTrade.color }} />
              <span className="text-[9px] font-mono" style={{ color: activeTrade.color }}>LIVE FEED</span>
            </span>
          </div>
          <div className="h-[120px]">
            <LiveChart color={activeTrade.color} trend={activeTrade.trend} />
          </div>
        </div>

        <div className="grid gap-3">
          {TRADES.map((trade, idx) => (
            <MarketCard 
              key={trade.symbol} 
              {...trade} 
              isActive={activeTradeIndex === idx}
              onClick={() => setActiveTradeIndex(idx)}
            />
          ))}
        </div>
      </div>

      {/* Testimonial Carousel */}
      <div className="pt-4 border-t border-white/10">
        <AnimatePresence mode="wait">
          <motion.div
            key={testimonialIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
          >
            <blockquote className="text-base text-gray-300 italic mb-4 leading-relaxed line-clamp-2">
              "{testimonial.quote}"
            </blockquote>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full bg-gradient-to-tr ${testimonial.color} shadow-lg shadow-white/5 flex items-center justify-center text-white text-sm font-bold`}>
                {testimonial.name.split(' ')[0][0]}{testimonial.name.split(' ')[1][0]}
              </div>
              <div>
                <cite className="text-white text-sm font-semibold block not-italic">{testimonial.name}</cite>
                <p className="text-gray-500 text-xs">{testimonial.role}</p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>

  );
};

export default AuthVisualPanel;
