'use server';

import yahooFinance from 'yahoo-finance2';

export type BacktestResult = {
  equityCurve: { date: string; equity: number; benchmark: number; price: number }[];
  trades: { date: string; type: 'BUY' | 'SELL'; price: number; shares: number; pnl?: number }[];
  stats: {
    initialCapital: number;
    finalCapital: number;
    totalReturn: number;
    benchmarkReturn: number;
    maxDrawdown: number;
    winRate: number;
    totalTrades: number;
  };
};

// Helper: Calculate SMA
function calculateSMA(data: number[], period: number) {
  const sma = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      sma.push(null);
    } else {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      sma.push(sum / period);
    }
  }
  return sma;
}

// Helper: Calculate RSI
function calculateRSI(data: number[], period: number = 14) {
  const rsi = [];
  let gains = 0;
  let losses = 0;

  for (let i = 0; i < data.length; i++) {
    if (i === 0) {
      rsi.push(null);
      continue;
    }
    const diff = data[i] - data[i - 1];
    if (i <= period) {
      if (diff > 0) gains += diff;
      else losses -= diff;
      if (i === period) {
        const avgGain = gains / period;
        const avgLoss = losses / period;
        const rs = avgGain / (avgLoss === 0 ? 1 : avgLoss);
        rsi.push(100 - 100 / (1 + rs));
      } else {
        rsi.push(null);
      }
    } else {
      const currentGain = diff > 0 ? diff : 0;
      const currentLoss = diff < 0 ? -diff : 0;
      gains = (gains * (period - 1) + currentGain) / period;
      losses = (losses * (period - 1) + currentLoss) / period;
      const rs = gains / (losses === 0 ? 1 : losses);
      rsi.push(100 - 100 / (1 + rs));
    }
  }
  return rsi;
}

export async function runBacktest(
  symbol: string,
  strategy: 'SMA_CROSSOVER' | 'RSI_REVERSION',
  initialCapital: number = 10000,
  years: number = 2
): Promise<BacktestResult> {
  try {
    const period2 = new Date();
    const period1 = new Date();
    period1.setFullYear(period2.getFullYear() - years);

    const historical: any[] = await yahooFinance.historical(symbol, {
      period1: period1.toISOString().split('T')[0],
      period2: period2.toISOString().split('T')[0],
      interval: '1d',
    });

    if (!historical || historical.length === 0) {
      throw new Error("No historical data found");
    }

    const prices = historical.map(d => d.close);
    const dates = historical.map(d => d.date.toISOString().split('T')[0]);

    let equity = initialCapital;
    let shares = 0;
    const equityCurve = [];
    const trades: any[] = [];
    let peakEquity = initialCapital;
    let maxDrawdown = 0;

    const initialPrice = prices[0];
    let winningTrades = 0;
    let losingTrades = 0;
    let lastBuyPrice = 0;

    if (strategy === 'SMA_CROSSOVER') {
      const sma50 = calculateSMA(prices, 50);
      const sma200 = calculateSMA(prices, 200);

      for (let i = 0; i < prices.length; i++) {
        const price = prices[i];
        const date = dates[i];

        if (sma50[i] !== null && sma200[i] !== null && i > 0) {
          const prev50 = sma50[i - 1]!;
          const prev200 = sma200[i - 1]!;
          const curr50 = sma50[i]!;
          const curr200 = sma200[i]!;

          // Buy Signal: 50 crosses above 200
          if (prev50 <= prev200 && curr50 > curr200 && shares === 0) {
            shares = equity / price;
            equity = 0;
            lastBuyPrice = price;
            trades.push({ date, type: 'BUY', price, shares });
          }
          // Sell Signal: 50 crosses below 200
          else if (prev50 >= prev200 && curr50 < curr200 && shares > 0) {
            equity = shares * price;
            const pnl = equity - (shares * lastBuyPrice);
            if (pnl > 0) winningTrades++;
            else losingTrades++;
            trades.push({ date, type: 'SELL', price, shares, pnl });
            shares = 0;
          }
        }

        const currentTotal = equity + (shares * price);
        if (currentTotal > peakEquity) peakEquity = currentTotal;
        const drawdown = (peakEquity - currentTotal) / peakEquity;
        if (drawdown > maxDrawdown) maxDrawdown = drawdown;

        equityCurve.push({
          date,
          price,
          equity: currentTotal,
          benchmark: (initialCapital / initialPrice) * price // Buy and hold equivalent
        });
      }
    } else if (strategy === 'RSI_REVERSION') {
      const rsi = calculateRSI(prices, 14);

      for (let i = 0; i < prices.length; i++) {
        const price = prices[i];
        const date = dates[i];

        if (rsi[i] !== null) {
          const currentRsi = rsi[i]!;
          
          // Buy when RSI < 30 (Oversold)
          if (currentRsi < 30 && shares === 0) {
            shares = equity / price;
            equity = 0;
            lastBuyPrice = price;
            trades.push({ date, type: 'BUY', price, shares });
          }
          // Sell when RSI > 70 (Overbought)
          else if (currentRsi > 70 && shares > 0) {
            equity = shares * price;
            const pnl = equity - (shares * lastBuyPrice);
            if (pnl > 0) winningTrades++;
            else losingTrades++;
            trades.push({ date, type: 'SELL', price, shares, pnl });
            shares = 0;
          }
        }

        const currentTotal = equity + (shares * price);
        if (currentTotal > peakEquity) peakEquity = currentTotal;
        const drawdown = (peakEquity - currentTotal) / peakEquity;
        if (drawdown > maxDrawdown) maxDrawdown = drawdown;

        equityCurve.push({
          date,
          price,
          equity: currentTotal,
          benchmark: (initialCapital / initialPrice) * price
        });
      }
    }

    // Close position at end if still holding
    const finalTotal = equity + (shares * prices[prices.length - 1]);
    const benchmarkFinal = (initialCapital / initialPrice) * prices[prices.length - 1];
    
    return {
      equityCurve,
      trades: trades.reverse(), // newest first
      stats: {
        initialCapital,
        finalCapital: finalTotal,
        totalReturn: ((finalTotal - initialCapital) / initialCapital) * 100,
        benchmarkReturn: ((benchmarkFinal - initialCapital) / initialCapital) * 100,
        maxDrawdown: maxDrawdown * 100,
        winRate: trades.length > 0 ? (winningTrades / (winningTrades + losingTrades)) * 100 : 0,
        totalTrades: winningTrades + losingTrades
      }
    };
  } catch (error) {
    console.error("Backtest failed:", error);
    throw new Error("Failed to run backtest");
  }
}
