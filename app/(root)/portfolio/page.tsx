import { getPortfolioHoldings } from '@/lib/actions/portfolio.actions';
import PortfolioClient from '@/components/PortfolioClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Portfolio Tracker | Tikki Trades',
  description: 'Track your stock holdings in real-time.',
};

export default async function PortfolioPage() {
  const initialHoldings = await getPortfolioHoldings();

  return (
    <div className="min-h-screen bg-black w-full pb-20">
      <div className="container max-w-7xl mx-auto pt-6 px-4 sm:px-6">
        <PortfolioClient initialHoldings={initialHoldings} />
      </div>
    </div>
  );
}
