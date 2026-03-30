'use server';

import { connectToDatabase } from '@/database/mongoose';
import { NotificationModel } from '@/database/models/notification.model';

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

export async function getUnreadNotifications(userId: string) {
  try {
    await connectToDatabase();
    
    const notifications = await NotificationModel.find({ userId, read: false })
      .sort({ createdAt: -1 });
      
    return JSON.parse(JSON.stringify(notifications));
  } catch (error) {
    console.error('Error fetching unread notifications:', error);
    return [];
  }
}

export async function markNotificationRead(notificationId: string) {
  try {
    await connectToDatabase();
    
    const notification = await NotificationModel.findByIdAndUpdate(
      notificationId,
      { read: true },
      { new: true }
    );
    
    return JSON.parse(JSON.stringify(notification));
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw new Error('Failed to mark notification as read');
  }
}

export async function markAllNotificationsRead(userId: string) {
  try {
    await connectToDatabase();
    
    await NotificationModel.updateMany({ userId, read: false }, { read: true });
    
    return { success: true };
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw new Error('Failed to mark all notifications as read');
  }
}
