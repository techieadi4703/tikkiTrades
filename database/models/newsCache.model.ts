import { Schema, model, models, type Document, type Model } from 'mongoose';

export interface NewsArticle {
  id: number;
  headline: string;
  summary: string;
  url: string;
  source: string;
  datetime: number;
  sentiment: 'Positive' | 'Negative' | 'Neutral';
  image?: string;
}

export interface NewsCacheItem extends Document {
  symbol: string;
  articles: NewsArticle[];
  updatedAt: Date;
}

const NewsArticleSchema = new Schema<NewsArticle>(
  {
    id: { type: Number, required: true },
    headline: { type: String, required: true },
    summary: { type: String, required: true },
    url: { type: String, required: true },
    source: { type: String, required: true },
    datetime: { type: Number, required: true },
    sentiment: { type: String, enum: ['Positive', 'Negative', 'Neutral'], required: true, default: 'Neutral' },
    image: { type: String },
  },
  { _id: false } // No need for separate _ids for subdocuments
);

const NewsCacheSchema = new Schema<NewsCacheItem>(
  {
    symbol: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    articles: { type: [NewsArticleSchema], default: [] },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

export const NewsCache: Model<NewsCacheItem> =
  (models?.NewsCache as Model<NewsCacheItem>) || model<NewsCacheItem>('NewsCache', NewsCacheSchema);
