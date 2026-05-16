import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/database/mongoose';
import { Alert } from '@/database/models/alert.model';
import { NotificationModel } from '@/database/models/notification.model';
import { getQuote, getBasicFinancials } from '@/lib/actions/finnhub.actions';

// This API route evaluates all active smart alerts.
// Call via cron (e.g., Vercel Cron) or manually: GET /api/cron/evaluate-alerts
// Recommended: every 15 minutes during market hours

export async function GET(request: Request) {
  // Optional: verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectToDatabase();

    const activeAlerts = await Alert.find({ triggered: false });

    if (activeAlerts.length === 0) {
      return NextResponse.json({ message: 'No active alerts to evaluate', evaluated: 0 });
    }

    // Group alerts by ticker to minimize API calls
    const tickerAlerts: Record<string, typeof activeAlerts> = {};
    for (const alert of activeAlerts) {
      const ticker = alert.ticker;
      if (!tickerAlerts[ticker]) tickerAlerts[ticker] = [];
      tickerAlerts[ticker].push(alert);
    }

    let triggered = 0;
    const results: string[] = [];

    for (const [ticker, alerts] of Object.entries(tickerAlerts)) {
      try {
        const quote = await getQuote(ticker);
        if (!quote || !quote.c) continue;

        const currentPrice = quote.c;
        const currentVolume = quote.v || 0;

        // Get average volume for volume spike alerts
        let avgVolume: number | null = null;
        const hasVolumeAlerts = alerts.some((a) => a.alertType === 'volume_spike');
        if (hasVolumeAlerts) {
          try {
            const financials = await getBasicFinancials(ticker);
            avgVolume = financials?.metric?.['10DayAverageTradingVolume'] || null;
            // Finnhub returns volume in millions, normalize
            if (avgVolume && avgVolume < 100000) {
              avgVolume = avgVolume * 1000000;
            }
          } catch (e) {
            console.warn(`Could not fetch avg volume for ${ticker}`);
          }
        }

        for (const alert of alerts) {
          let shouldTrigger = false;
          let notificationMessage = '';

          switch (alert.alertType) {
            case 'price': {
              if (alert.condition === 'above' && currentPrice >= alert.targetPrice) {
                shouldTrigger = true;
                notificationMessage = `📈 Price Alert: ${ticker} has risen above $${alert.targetPrice.toFixed(2)}! Current price: $${currentPrice.toFixed(2)}`;
              } else if (alert.condition === 'below' && currentPrice <= alert.targetPrice) {
                shouldTrigger = true;
                notificationMessage = `📉 Price Alert: ${ticker} has dropped below $${alert.targetPrice.toFixed(2)}! Current price: $${currentPrice.toFixed(2)}`;
              }
              break;
            }

            case 'volume_spike': {
              if (avgVolume && currentVolume > 0) {
                const multiplier = currentVolume / avgVolume;
                const threshold = alert.volumeThreshold || 2.0;
                if (multiplier >= threshold) {
                  shouldTrigger = true;
                  notificationMessage = `🔥 Volume Spike: ${ticker} volume is ${multiplier.toFixed(1)}x the average! (${(currentVolume / 1000000).toFixed(1)}M vs avg ${(avgVolume / 1000000).toFixed(1)}M). Something big may be happening.`;
                }
              }
              break;
            }

            case 'sentiment_shift': {
              // For sentiment, we check the price movement direction as a proxy
              // A more advanced implementation would use the news sentiment API
              const priceChange = quote.d || 0;
              const changePercent = quote.dp || 0;

              if (alert.sentimentDirection === 'bearish' && changePercent <= -2) {
                shouldTrigger = true;
                notificationMessage = `🐻 Sentiment Alert: ${ticker} is showing bearish signals, down ${changePercent.toFixed(2)}% ($${priceChange.toFixed(2)}) today. Consider reviewing your position.`;
              } else if (alert.sentimentDirection === 'bullish' && changePercent >= 2) {
                shouldTrigger = true;
                notificationMessage = `🐂 Sentiment Alert: ${ticker} is showing bullish momentum, up +${changePercent.toFixed(2)}% (+$${Math.abs(priceChange).toFixed(2)}) today. The trend looks strong.`;
              }
              break;
            }
          }

          if (shouldTrigger) {
            // Mark alert as triggered
            await Alert.findByIdAndUpdate(alert._id, {
              triggered: true,
              triggeredAt: new Date(),
              smartAlertMessage: notificationMessage,
            });

            // Create notification for the user
            await NotificationModel.create({
              userId: alert.userId,
              message: notificationMessage,
            });

            triggered++;
            results.push(`✅ ${ticker} [${alert.alertType}] → Triggered`);
          } else {
            results.push(`⏳ ${ticker} [${alert.alertType}] → Not yet`);
          }
        }
      } catch (err) {
        console.error(`Error evaluating alerts for ${ticker}:`, err);
        results.push(`❌ ${ticker} → Error`);
      }
    }

    return NextResponse.json({
      message: `Evaluated ${activeAlerts.length} alerts, ${triggered} triggered`,
      evaluated: activeAlerts.length,
      triggered,
      results,
    });
  } catch (error) {
    console.error('Smart alert cron error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
