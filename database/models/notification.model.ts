import { Schema, model, models, type Document, type Model } from 'mongoose';

export interface NotificationItem extends Document {
  userId: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<NotificationItem>(
  {
    userId: { type: String, required: true, index: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

// Index to quickly find unread notifications per user
NotificationSchema.index({ userId: 1, read: 1 });
NotificationSchema.index({ createdAt: -1 });

export const NotificationModel: Model<NotificationItem> =
  (models?.Notification as Model<NotificationItem>) || model<NotificationItem>('Notification', NotificationSchema);
