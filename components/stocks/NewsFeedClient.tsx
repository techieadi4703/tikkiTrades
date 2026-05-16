'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Clock, Newspaper } from 'lucide-react';
import { formatTimeAgo } from '@/lib/utils';
import { NewsArticle } from '@/database/models/newsCache.model';

interface NewsFeedClientProps {
  articles: NewsArticle[];
}

export default function NewsFeedClient({ articles }: NewsFeedClientProps) {
  if (!articles || articles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-secondary/50 border border-border rounded-2xl">
        <Newspaper className="w-12 h-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No recent company news found.</p>
      </div>
    );
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const getSentimentStyles = (sentiment: string) => {
    switch (sentiment) {
      case 'Positive':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Negative':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-muted-foreground border-gray-500/20';
    }
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="flex flex-row overflow-x-auto gap-4 pb-4 snap-x snap-mandatory scrollbar-hide-default"
    >
      {articles.map((article) => (
        <motion.a
          variants={item}
          key={article.id}
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex flex-col justify-between bg-card hover:bg-secondary/40 border border-border hover:border-emerald-500/30 rounded-xl p-4 sm:p-5 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 min-w-[320px] max-w-[320px] shrink-0 snap-start"
        >
          <div className="flex gap-4">
            <div className="flex flex-col flex-1">
              <div className="flex items-center flex-wrap gap-2.5 mb-2">
                <span className="text-[11px] font-bold text-muted-foreground tracking-wider uppercase">
                  {article.source}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded border ${getSentimentStyles(article.sentiment)} font-semibold tracking-wide uppercase`}>
                  {article.sentiment}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-foreground group-hover:text-emerald-500 transition-colors leading-snug line-clamp-2">
                {article.headline}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                {article.summary}
              </p>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground mt-4 pt-4 border-t border-border">
            <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatTimeAgo(article.datetime)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="font-semibold tracking-wide uppercase text-[10px]">Read Article</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </div>
          </div>
        </motion.a>
      ))}
    </motion.div>
  );
}
