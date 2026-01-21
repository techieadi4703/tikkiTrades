import { getWatchlist } from '@/lib/actions/watchlist.actions';

export default async function WatchlistPage() {
  const watchlist = await getWatchlist();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Your Watchlist</h1>

      {watchlist.length === 0 ? (
        <p className="text-gray-400">No stocks in watchlist</p>
      ) : (
        <div className="space-y-3">
          {watchlist.map((item) => (
            <div
              key={item._id.toString()}
              className="flex items-center justify-between bg-gray-900 p-4 rounded-lg"
            >
              <div>
                <div className="font-medium">{item.company}</div>
                <div className="text-sm text-gray-400">{item.symbol}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
