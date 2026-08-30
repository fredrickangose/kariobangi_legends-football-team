import { getClubData } from "./actions";
import ClubWebsite from "./ClubWebsite";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const clubDataResult = await getClubData();

  if (!clubDataResult.success) {
    return (
      <main className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-3xl font-black text-rose-500">Database Connection Failed</h1>
        <p className="text-slate-400 mt-2 max-w-md text-sm">
          Please check your database environment setup. Drizzle could not query the PostgreSQL database.
        </p>
        <p className="text-xs text-rose-400/80 bg-rose-950/40 p-4 rounded-xl mt-4 max-w-xl font-mono">
          {clubDataResult.error}
        </p>
      </main>
    );
  }

  const initialData = {
    players: clubDataResult.players || [],
    fixtures: clubDataResult.fixtures || [],
    news: clubDataResult.news || [],
    merchandise: clubDataResult.merchandise || [],
    donations: clubDataResult.donations || [],
    fanMessages: clubDataResult.fanMessages || [],
    gallery: clubDataResult.gallery || [],
  };

  return <ClubWebsite initialData={initialData} />;
}
