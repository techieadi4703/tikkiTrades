'use server';

import { connectToDatabase } from '@/database/mongoose';
import { NotificationModel } from '@/database/models/notification.model';
import { auth } from '../better-auth/auth';
import { headers } from 'next/headers';

export async function createNotification(userId: string, message: string) {
  try {
    await connectToDatabase();
    
    const notification = await NotificationModel.create({
      userId,
      message,
    });
    
    return JSON.parse(JSON.stringify(notification));
  } catch (error) {
    console.error('Error creating notification:', error);
    throw new Error('Failed to create notification');
  }
}

export async function getUnreadNotifications() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.email) return [];

  try {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error('DB not initialized');

    const user = await db.collection('user').findOne({ email: session.user.email });
    if (!user) return [];

    const userId = user.id || String(user._id);

    const notifications = await NotificationModel.find({ userId, read: false })
      .sort({ createdAt: -1 });
      
    return JSON.parse(JSON.stringify(notifications));
  } catch (error) {
    console.error('Error fetching unread notifications:', error);
    return [];
  }
}

export async function markNotificationRead(notificationId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.email) throw new Error('Not authenticated');

  try {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error('DB not initialized');

    const user = await db.collection('user').findOne({ email: session.user.email });
    if (!user) throw new Error('User not found');

    const userId = user.id || String(user._id);

    const notification = await NotificationModel.findById(notificationId);
    if (!notification) throw new Error('Notification not found');
    if (notification.userId !== userId) throw new Error('Unauthorized');

    notification.read = true;
    await notification.save();
    
    return JSON.parse(JSON.stringify(notification));
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw new Error('Failed to mark notification as read');
  }
}

export async function markAllNotificationsRead() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.email) throw new Error('Not authenticated');

  try {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error('DB not initialized');

    const user = await db.collection('user').findOne({ email: session.user.email });
    if (!user) throw new Error('User not found');

    const userId = user.id || String(user._id);
    
    await NotificationModel.updateMany({ userId, read: false }, { read: true });
    
    return { success: true };
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw new Error('Failed to mark all notifications as read');
  }
}
