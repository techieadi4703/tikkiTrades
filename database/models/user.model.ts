import { Schema, model, models, InferSchemaType } from "mongoose";

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      index: true,
      unique: true,
    },
    name: {
      type: String,
    },
  },
  {
    collection: "users",
    timestamps: true,
  }
);

export type UserDocument = InferSchemaType<typeof userSchema>;

export const User =
  models?.User || model<UserDocument>("User", userSchema);
