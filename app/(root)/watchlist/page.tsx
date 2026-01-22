import { getWatchlist } from "@/lib/actions/watchlist.actions";
import WatchlistClient from "./watchlist-client";
import { getQuote } from "@/lib/actions/finnhub.actions";

export default async function WatchlistPage() {
  const watchlist = await getWatchlist();
  const quotes = await Promise.all(watchlist.map(w => getQuote(w.symbol)));

  const data = watchlist.map((item, i) => {
    const q = quotes[i];
    return {
      _id: String(item._id),
      company: item.company,
      symbol: item.symbol,
      price: q?.c || 0,
      change: q?.d || 0,
      changePercent: q?.dp || 0,
      volume: q?.v || 0,
    };
  });

  return <WatchlistClient initialData={data} />;
}
