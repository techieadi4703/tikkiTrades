'use server';

import {connectToDatabase} from "@/database/mongoose";

export const getAllUsersForNewsEmail = async () => {
    try {
        const mongoose = await connectToDatabase();
        const db = mongoose.connection.db;
        if(!db) throw new Error('Mongoose connection not connected');

        const users = await db.collection('user').find(
            { email: { $exists: true, $ne: null }},
            { projection: { _id: 1, id: 1, email: 1, name: 1, country:1 }}
        ).toArray();

        return users.filter((user) => user.email && user.name).map((user) => ({
            id: user.id || user._id?.toString() || '',
            email: user.email,
            name: user.name
        }))
    } catch (e) {
        console.error('Error fetching users for news email:', e)
        return []
    }
}

export type UserForNewsEmail = {
  id: string;
  email: string;
  name: string;
};

export const getUsersByIds = async (ids: string[]) => {
    try {
        const mongoose = await connectToDatabase();
        const db = mongoose.connection.db;
        if(!db) throw new Error('Mongoose connection not connected');

        const objectIds = ids.filter(id => id.length === 24).map(id => new mongoose.Types.ObjectId(id));

        const queryOr = [];
        if (objectIds.length > 0) queryOr.push({ _id: { $in: objectIds } });
        if (ids.length > 0) queryOr.push({ id: { $in: ids } });

        if (queryOr.length === 0) return [];

        const users = await db.collection('user').find({
            $or: queryOr
        }).toArray();

        return users.map(user => ({
            id: user.id || user._id?.toString() || '',
            email: user.email,
            name: user.name
        }));
    } catch (e) {
        console.error('Error fetching users by ids:', e);
        return [];
    }
}
