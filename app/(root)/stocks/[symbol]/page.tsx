import { isInWatchlist } from "@/lib/actions/watchlist.actions";
import { getCompanyProfile } from "@/lib/actions/finnhub.actions";
import StockDetailsClient from "@/components/stocks/StockDetailsClient";

export interface StockDetailsPageProps {
  params: Promise<{ symbol: string }>;
}

export default async function StockDetails({ params }: StockDetailsPageProps) {
  const { symbol } = await params;
  const upper = symbol.toUpperCase();
  const alreadyInWatchlist = await isInWatchlist(upper);
  const profile = await getCompanyProfile(upper);
  const companyName = profile?.name || upper;

  return (
    <StockDetailsClient 
      symbol={symbol}
      upper={upper}
      companyName={companyName}
      alreadyInWatchlist={alreadyInWatchlist}
    />
  );
}