'use client';

import React from 'react';
import Link from 'next/link';
import { TrendingUp, Github, Twitter, Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="border-t border-border bg-card/50 backdrop-blur-md mt-auto">
      <div className="container px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          
          {/* Brand */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 group">
              <div className="bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
              </div>
              <span className="text-foreground font-bold text-lg tracking-tight">TikkiTrades</span>
            </div>
            <p className="text-muted-foreground text-sm max-w-xs">
              Real-time stock tracking, AI-powered insights, and personalized price alerts.
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col gap-2">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-widest mb-2">Quick Links</h4>
            <Link href="/" className="text-sm text-muted-foreground hover:text-emerald-500 transition-colors w-fit">Dashboard</Link>
            <Link href="/watchlist" className="text-sm text-muted-foreground hover:text-emerald-500 transition-colors w-fit">Watchlist</Link>
            <Link href="/portfolio" className="text-sm text-muted-foreground hover:text-emerald-500 transition-colors w-fit">Portfolio</Link>
            <Link href="/journal" className="text-sm text-muted-foreground hover:text-emerald-500 transition-colors w-fit">Journal</Link>
          </div>

          {/* Social / Info */}
          <div className="flex flex-col gap-2">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-widest mb-2">Connect</h4>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-emerald-500 transition-colors w-fit">
              <Github className="w-4 h-4" /> GitHub
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-emerald-500 transition-colors w-fit">
              <Twitter className="w-4 h-4" /> Twitter
            </a>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} TikkiTrades. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            Built with <Heart className="w-3 h-3 text-red-500 fill-red-500" /> by Aditya
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
