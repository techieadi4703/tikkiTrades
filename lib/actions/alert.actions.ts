'use server';

import { auth } from '../better-auth/auth';
import { headers } from 'next/headers';
import { connectToDatabase } from '@/database/mongoose';
import { Alert, AlertItem } from '@/database/models/alert.model';
import { revalidatePath } from 'next/cache';

export async function createAlert({
  ticker,
  targetPrice,
  condition,
}: {
  ticker: string;
  targetPrice: number;
  condition: 'above' | 'below';
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.email) throw new Error("Not authenticated");

  try {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error("MongoDB connection not found");

    const user = await db.collection("user").findOne({ email: session.user.email });
    if (!user) throw new Error("User not found");

    const userId = user.id || String(user._id);
    
    const newAlert = await Alert.create({
      userId,
      ticker: ticker.toUpperCase(),
      targetPrice,
      condition,
      triggered: false,
    });
    
    revalidatePath(`/search/${ticker.toLowerCase()}`);
    return JSON.parse(JSON.stringify(newAlert));
  } catch (error) {
    console.error('Error creating alert:', error);
    throw new Error('Failed to create alert');
  }
}

export async function getUserAlerts(userId: string) {
  try {
    await connectToDatabase();
    
    const alerts = await Alert.find({ userId }).sort({ createdAt: -1 });
    return JSON.parse(JSON.stringify(alerts));
  } catch (error) {
    console.error('Error fetching user alerts:', error);
    return [];
  }
}

export async function getActiveAlerts() {
  try {
    await connectToDatabase();
    
    // Find alerts where triggered is false
    const activeAlerts = await Alert.find({ triggered: false });
    return activeAlerts.map(a => JSON.parse(JSON.stringify(a)));
  } catch (error) {
    console.error('Error fetching active alerts:', error);
    return [];
  }
}

export async function markAlertTriggered(alertId: string) {
  try {
    await connectToDatabase();
    
    const alert = await Alert.findByIdAndUpdate(
      alertId,
      { triggered: true, triggeredAt: new Date() },
      { new: true }
    );
    return JSON.parse(JSON.stringify(alert));
  } catch (error) {
    console.error('Error marking alert as triggered:', error);
    throw new Error('Failed to mark alert as triggered');
  }
}
