export function calculatePositionMath({
  currentPrice,
  previousClose,
  shares,
  averagePrice,
}: {
  currentPrice: number;
  previousClose: number;
  shares: number;
  averagePrice: number;
}) {
  const totalValue = currentPrice * shares;
  const totalCost = averagePrice * shares;
  const unrealizedPnL = totalValue - totalCost;
  
  // Guard against zero-cost-basis division by zero
  const unrealizedPnLPercent = totalCost > 0 ? (unrealizedPnL / totalCost) * 100 : 0;
  
  const dailyChange = (currentPrice - previousClose) * shares;
  
  // Guard against previousClose division by zero
  const dailyChangePercent = previousClose > 0 ? ((currentPrice - previousClose) / previousClose) * 100 : 0;

  return {
    totalValue,
    totalCost,
    unrealizedPnL,
    unrealizedPnLPercent,
    dailyChange,
    dailyChangePercent,
  };
}

export function shouldTriggerAlert(
  condition: 'above' | 'below',
  currentPrice: number,
  targetPrice: number
): boolean {
  if (condition === 'above' && currentPrice >= targetPrice) {
    return true;
  }
  if (condition === 'below' && currentPrice <= targetPrice) {
    return true;
  }
  return false;
}
