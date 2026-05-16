import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";
import GlobalAIAssistant from "@/components/GlobalAIAssistant";
import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import React from "react";

const layout = async ({ children }: { children: React.ReactNode }) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) redirect("/sign-in");

  const user = {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
  };
  return (
    <main className="min-h-screen flex flex-col text-foreground">
      <Header user={user} />
      <div className="container py-10 flex-1">
        <PageTransition>{children}</PageTransition>
      </div>
      <Footer />
      <GlobalAIAssistant />
    </main>
  );
};

export default layout;
