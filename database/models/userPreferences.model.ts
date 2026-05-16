import { Schema, model, models, type Document, type Model } from 'mongoose';

export interface UserPreferencesItem extends Document {
  userId: string;
  dashboardWidgetOrder: string[];
  updatedAt: Date;
}

const UserPreferencesSchema = new Schema<UserPreferencesItem>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    dashboardWidgetOrder: { type: [String], default: ['market-overview', 'heatmap', 'top-stories', 'market-data'] },
  },
  { timestamps: true }
);

export const UserPreferences: Model<UserPreferencesItem> =
  (models?.UserPreferences as Model<UserPreferencesItem>) || model<UserPreferencesItem>('UserPreferences', UserPreferencesSchema);
