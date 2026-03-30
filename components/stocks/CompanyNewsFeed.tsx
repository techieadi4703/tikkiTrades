import React from 'react';
import { getCompanyNewsWithSentiment } from '@/lib/actions/news.actions';
import NewsFeedClient from './NewsFeedClient';

export default async function CompanyNewsFeed({ symbol }: { symbol: string }) {
  const articles = await getCompanyNewsWithSentiment(symbol);

  return (
    <div className="w-full flex flex-col h-[400px]">
      <div className="flex items-center gap-3 mb-6 shrink-0">
        <div className="h-8 w-1 bg-emerald-500 rounded-full"></div>
        <h2 className="text-xl xl:text-2xl font-bold text-white tracking-tight">Latest News & Sentinel AI</h2>
      </div>
      <div className="flex-1 overflow-y-auto pr-3 scrollbar-hide-default">
        <NewsFeedClient articles={articles} />
      </div>
    </div>
  );
}
