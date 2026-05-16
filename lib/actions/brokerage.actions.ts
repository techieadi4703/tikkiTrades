'use server';

import { connectToDatabase } from '@/database/mongoose';
import { PaperAccount, PaperOrder } from '@/database/models/brokerage.model';
import { Portfolio } from '@/database/models/portfolio.model';
import { auth } from '../better-auth/auth';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { getQuote } from './finnhub.actions';

export async function getPaperAccount() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.email) return null;

  try {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error('MongoDB connection not found');

    const user = await db.collection('user').findOne({ email: session.user.email });
    if (!user) throw new Error('User not found');
    const userId = user.id || String(user._id);

    let account = await PaperAccount.findOne({ userId });
    
    if (!account) {
      account = await PaperAccount.create({
        userId,
        buyingPower: 100000,
        initialBalance: 100000
      });
    }

    return JSON.parse(JSON.stringify(account));
  } catch (error) {
    console.error("Failed to get paper account", error);
    return null;
  }
}

export async function getPaperOrders() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.email) return [];

  try {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error('MongoDB connection not found');

    const user = await db.collection('user').findOne({ email: session.user.email });
    if (!user) throw new Error('User not found');
    const userId = user.id || String(user._id);

    const orders = await PaperOrder.find({ userId }).sort({ createdAt: -1 }).limit(50);
    return JSON.parse(JSON.stringify(orders));
  } catch (error) {
    console.error("Failed to get paper orders", error);
    return [];
  }
}

export async function executePaperTrade(params: {
  symbol: string;
  action: 'BUY' | 'SELL';
  shares: number;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.email) {
    return { success: false, message: 'Not authenticated' };
  }

  try {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error('MongoDB connection not found');

    const user = await db.collection('user').findOne({ email: session.user.email });
    if (!user) throw new Error('User not found');
    const userId = user.id || String(user._id);

    // Get real-time price
    const quote = await getQuote(params.symbol);
    if (!quote || !quote.c) {
      return { success: false, message: 'Could not fetch real-time price for execution.' };
    }
    const currentPrice = quote.c;
    const totalAmount = currentPrice * params.shares;

    // Get Account
    let account = await PaperAccount.findOne({ userId });
    if (!account) {
      account = await PaperAccount.create({ userId, buyingPower: 100000, initialBalance: 100000 });
    }

    // Get Portfolio Holding
    let holding = await Portfolio.findOne({ userId, symbol: params.symbol.toUpperCase() });

    if (params.action === 'BUY') {
      if (account.buyingPower < totalAmount) {
        return { success: false, message: `Insufficient Buying Power. Need $${totalAmount.toFixed(2)}, but have $${account.buyingPower.toFixed(2)}.` };
      }

      // Deduct cash
      account.buyingPower -= totalAmount;
      await account.save();

      // Update or create holding
      if (holding) {
        // Calculate new average price
        const totalValueOld = holding.shares * holding.averagePrice;
        const totalValueNew = totalAmount;
        holding.shares += params.shares;
        holding.averagePrice = (totalValueOld + totalValueNew) / holding.shares;
        await holding.save();
      } else {
        await Portfolio.create({
          userId,
          symbol: params.symbol.toUpperCase(),
          shares: params.shares,
          averagePrice: currentPrice,
          datePurchased: new Date(),
        });
      }

    } else if (params.action === 'SELL') {
      if (!holding || holding.shares < params.shares) {
        return { success: false, message: `Insufficient shares. You only have ${holding ? holding.shares : 0} shares of ${params.symbol}.` };
      }

      // Add cash
      account.buyingPower += totalAmount;
      await account.save();

      // Update or remove holding
      holding.shares -= params.shares;
      if (holding.shares <= 0.000001) { // Floating point precision check
        await Portfolio.deleteOne({ _id: holding._id });
      } else {
        await holding.save();
      }
    }

    // Create Order Record
    await PaperOrder.create({
      userId,
      symbol: params.symbol.toUpperCase(),
      action: params.action,
      orderType: 'MARKET',
      shares: params.shares,
      executionPrice: currentPrice,
      totalAmount,
      status: 'EXECUTED'
    });

    revalidatePath('/portfolio');
    revalidatePath(`/stocks/${params.symbol}`);
    
    return { success: true, message: `Successfully ${params.action === 'BUY' ? 'bought' : 'sold'} ${params.shares} shares of ${params.symbol} at $${currentPrice.toFixed(2)}.` };

  } catch (error: any) {
    console.error("Trade Execution Error:", error);
    return { success: false, message: error.message || 'Trade execution failed.' };
  }
}

export async function refillPaperAccount() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.email) {
    return { success: false, message: 'Not authenticated' };
  }

  try {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error('MongoDB connection not found');

    const user = await db.collection('user').findOne({ email: session.user.email });
    if (!user) throw new Error('User not found');
    const userId = user.id || String(user._id);

    // Reset account balance
    await PaperAccount.findOneAndUpdate(
      { userId },
      { buyingPower: 100000, initialBalance: 100000, updatedAt: new Date() },
      { upsert: true }
    );

    // Clear all holdings
    await Portfolio.deleteMany({ userId });

    // Clear all orders
    await PaperOrder.deleteMany({ userId });

    revalidatePath('/portfolio');
    revalidatePath('/');

    return { success: true, message: 'Account refilled to $100,000. All positions and history have been reset.' };
  } catch (error: any) {
    console.error("Refill Error:", error);
    return { success: false, message: error.message || 'Failed to refill account.' };
  }
}
