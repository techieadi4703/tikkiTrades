'use server';

import {auth} from "@/lib/better-auth/auth";
import {inngest} from "@/lib/inngest/client";
import {headers} from "next/headers";

export const signUpWithEmail = async ({ email, password, fullName }: SignUpFormData) => {
    try {
        const response = await auth.api.signUpEmail({ body: { email, password, name: fullName } })

        if(response) {
            await inngest.send({
                name: 'app/user.created',
                data: { email, name: fullName }
            })
        }

        return { success: true, data: response }
    } catch (e: any) {
        const message = e?.body?.message || "Sign up failed. Please try again.";
        console.error('Sign up failed:', e);
        return { success: false, error: message }
    }
}

export const signInWithEmail = async ({ email, password }: SignInFormData) => {
  try {
    const response = await auth.api.signInEmail({
      body: { email, password },
    });

    return { success: true, data: response };
  } catch (e: any) {
    const message = e?.body?.message || "Invalid email or password";
    console.error('Sign in failed:', e);
    return { success: false, error: message };
  }
};


export const signOut = async () => {
    try {
        await auth.api.signOut({ headers: await headers() });
    } catch (e) {
        console.log('Sign out failed', e)
        return { success: false, error: 'Sign out failed' }
    }
}