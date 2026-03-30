import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getUserJournalEntries } from "@/lib/actions/journal.actions";
import JournalClient from "./journal-client";

export const metadata = {
  title: "AI Trade Journal | Tikki Trades",
  description: "Log your trades and get brutally honest AI feedback.",
};

const JournalPage = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const entries = await getUserJournalEntries(session.user.id);

  return <JournalClient initialEntries={entries} userId={session.user.id} />;
};

export default JournalPage;
