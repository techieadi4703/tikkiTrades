'use server';

import { auth } from '@/lib/better-auth/auth';
import { headers } from 'next/headers';
import { connectToDatabase } from '@/database/mongoose';
import { UserPreferences } from '@/database/models/userPreferences.model';

export async function getDashboardWidgetOrder(): Promise<string[]> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) return [];

    await connectToDatabase();
    const prefs = await UserPreferences.findOne({ userId: session.user.id });
    return prefs?.dashboardWidgetOrder || [];
  } catch (error) {
    console.error('Error getting widget order:', error);
    return [];
  }
}

export async function saveDashboardWidgetOrder(widgetOrder: string[]): Promise<boolean> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) throw new Error('Not authenticated');

    await connectToDatabase();
    await UserPreferences.findOneAndUpdate(
      { userId: session.user.id },
      { dashboardWidgetOrder: widgetOrder },
      { upsert: true, new: true }
    );
    return true;
  } catch (error) {
    console.error('Error saving widget order:', error);
    return false;
  }
}
