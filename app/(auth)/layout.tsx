import Image from "next/image";
import Link from "next/link";
import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { TrendingUp } from "lucide-react";
import AuthVisualPanel from "@/components/auth/AuthVisualPanel";

const layout = async ({ children }: { children: React.ReactNode }) => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user) redirect("/");

  return (
    <main className="relative h-screen flex items-center justify-center p-4 lg:p-8 overflow-hidden bg-black">

      <div className="relative z-10 w-full max-w-7xl grid lg:grid-cols-[0.85fr_1.15fr] gap-8 lg:gap-12 items-center h-full max-h-[900px]">

        {/* Left Section: Form */}
        <section className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 lg:p-12 shadow-2xl flex flex-col gap-8 max-w-xl mx-auto w-full relative overflow-hidden">
          {/* Subtle glow inside the form card */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500/50 to-transparent" />
          
          <Link href="/" className="flex items-center gap-3 group">
            <div className="bg-green-500/10 p-2.5 rounded-xl group-hover:bg-green-500/20 transition-all border border-green-500/20 shadow-[0_0_20px_rgba(34,197,94,0.1)]">
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
            <span className="text-white font-bold text-2xl tracking-tight">TikkiTrades</span>
          </Link>




          <div className="flex-1 w-full animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300 fill-mode-both">
            {children}
          </div>
        </section>

        {/* Right Section: Visual Panel (Client Component) */}
        <AuthVisualPanel />
      </div>
    </main>
  );
};


export default layout;
