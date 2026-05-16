import { isInWatchlist } from "@/lib/actions/watchlist.actions";
import { getCompanyProfile } from "@/lib/actions/finnhub.actions";
import { getCompanyNewsWithSentiment } from "@/lib/actions/news.actions";
import StockDetailsClient from "@/components/stocks/StockDetailsClient";
import NewsFeedClient from "@/components/stocks/NewsFeedClient";

export interface StockDetailsPageProps {
  params: Promise<{ symbol: string }>;
}

export default async function StockDetails({ params }: StockDetailsPageProps) {
  const { symbol } = await params;
  const upper = symbol.toUpperCase();
  
  // Fetch data in parallel
  const [alreadyInWatchlist, profile, newsData] = await Promise.all([
    isInWatchlist(upper),
    getCompanyProfile(upper),
    getCompanyNewsWithSentiment(upper)
  ]);
  
  const companyName = profile?.name || upper;

  return (
    <StockDetailsClient 
      symbol={symbol}
      upper={upper}
      companyName={companyName}
      alreadyInWatchlist={alreadyInWatchlist}
      newsFeedNode={<NewsFeedClient articles={newsData.articles} />}
      sentinelScoreData={newsData.score}
    />
  );
}