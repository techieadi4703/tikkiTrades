"use client";
import React, { useMemo, useState } from "react";
import { addToWatchlist, removeFromWatchlist } from "@/lib/actions/watchlist.actions";
import { motion } from "framer-motion";

const WatchlistButton = ({
  symbol,
  company,
  isInWatchlist,
  showTrashIcon = false,
  type = "button",
  onRemove,
}: {
  symbol: string;
  company: string;
  isInWatchlist?: boolean;
  showTrashIcon?: boolean;
  type?: "button" | "icon";
  onRemove?: (symbol: string) => void;
}) => {
  const [added, setAdded] = useState<boolean>(!!isInWatchlist);

  const label = useMemo(() => {
    if (type === "icon") return "";
    return added ? "Remove from Watchlist" : "Add to Watchlist";
  }, [added, type]);

  const handleClick = async () => {
    const next = !added;
    setAdded(next);

    if (next) {
      await addToWatchlist(symbol, company);
    } else {
      if (onRemove) onRemove(symbol);
      await removeFromWatchlist(symbol);
    }
  };

  if (type === "icon") {
    return (
      <motion.button
        whileTap={{ scale: 0.9 }}
        className={`watchlist-icon-btn flex items-center justify-center rounded-full p-2 transition-all ${added ? "text-emerald-500 bg-emerald-500/10" : "text-gray-400 hover:text-emerald-400 hover:bg-white/5"}`}
        onClick={handleClick}
      >
        <span className="text-xl">⭐</span>
      </motion.button>
    );
  }

  return (
    <motion.button 
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`w-full ${added ? "emerald-remove" : "emerald-btn"}`} 
      onClick={handleClick}
    >
      {label}
    </motion.button>
  );
};

export default WatchlistButton;
