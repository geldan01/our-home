import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getChannels, createChannel, deleteChannel } from "@/lib/tv-actions";

function DeleteButton({ id }: { id: string }) {
  async function handleDelete() {
    "use server";
    await deleteChannel(id);
  }
  return (
    <form action={handleDelete}>
      <button
        type="submit"
        className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
      >
        Remove
      </button>
    </form>
  );
}

export default async function ChannelsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const channels = await getChannels();

  return (
    <div className="flex min-h-full flex-1 items-start justify-center px-4 py-10 sm:px-6">
      <div className="w-full max-w-lg space-y-8">
        <div className="flex items-center justify-between border-b border-violet-200/60 pb-4 dark:border-violet-900/30">
          <div>
            <h1 className="text-2xl font-bold text-violet-900 dark:text-violet-100">
              Channels
            </h1>
            <p className="mt-1 text-sm text-violet-600/70 dark:text-violet-400/60">
              Streaming services &amp; TV providers
            </p>
          </div>
          <Link
            href="/tv"
            className="text-sm text-violet-600 hover:text-violet-800 dark:text-violet-400 dark:hover:text-violet-200"
          >
            &larr; TV Shows
          </Link>
        </div>

        {/* Add channel form */}
        <form action={createChannel} className="flex gap-3">
          <input
            type="text"
            name="name"
            placeholder="Add a channel (e.g. Netflix, Prime, Bell)..."
            required
            className="flex-1 rounded-lg border border-violet-200 bg-white px-4 py-2.5 text-sm text-stone-900 placeholder-stone-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-none dark:border-violet-800 dark:bg-stone-900 dark:text-stone-100 dark:placeholder-stone-500"
          />
          <button
            type="submit"
            className="rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-violet-700 dark:bg-violet-500 dark:hover:bg-violet-600"
          >
            Add
          </button>
        </form>

        {/* Channel list */}
        {channels.length > 0 ? (
          <ul className="divide-y divide-violet-100 rounded-xl border border-violet-200/80 bg-white dark:divide-violet-900/40 dark:border-violet-900/40 dark:bg-stone-900/60">
            {channels.map((channel) => (
              <li
                key={channel.id}
                className="flex items-center justify-between px-5 py-3.5"
              >
                <span className="font-medium text-stone-800 dark:text-stone-200">
                  {channel.name}
                </span>
                <DeleteButton id={channel.id} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-xl border border-dashed border-violet-300/60 py-12 text-center dark:border-violet-700/40">
            <p className="text-sm text-violet-400 dark:text-violet-500">
              No channels yet. Add your first one above.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
