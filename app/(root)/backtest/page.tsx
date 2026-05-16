import BacktestClient from "./BacktestClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Algorithmic Backtester | Tikki Trades',
  description: 'Simulate trading strategies against historical market data.',
};

export default function BacktestPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <BacktestClient />
    </div>
  );
}
