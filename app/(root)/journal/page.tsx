import { getUserJournalEntries } from "@/lib/actions/journal.actions";
import JournalClient from "./journal-client";
import { requireRole } from "@/lib/rbac";

export const metadata = {
  title: "AI Trade Journal | Tikki Trades",
  description: "Log your trades and get brutally honest AI feedback.",
};

const JournalPage = async () => {
  await requireRole(["Premium User", "Admin"]);

  const entries = await getUserJournalEntries();

  return <JournalClient initialEntries={entries} />;
};

export default JournalPage;
