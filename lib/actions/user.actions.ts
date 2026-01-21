"use server";

import { connectToDatabase } from "@/database/mongoose";
import { User } from "@/database/models/user.model";

export type UserForNewsEmail = {
  id: string;
  email: string;
  name: string;
};

export const getAllUsersForNewsEmail = async (): Promise<UserForNewsEmail[]> => {
  try {
    await connectToDatabase();

    const users = await User.find({
      email: { $exists: true, $ne: null },
      name: { $exists: true, $ne: null },
    })
      .select("_id email name")
      .lean();

    return users.map((user) => ({
      id: user._id.toString(),
      email: user.email,
      name: user.name,
    }));
  } catch (error) {
    console.error("Error fetching users for news email:", error);
    return [];
  }
};

