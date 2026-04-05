"use client";

import { useTransition } from "react";
import { updateShowStatus, removeShow, refreshShowData } from "@/lib/tv-actions";
import { useRouter } from "next/navigation";
import { TvShowStatus } from "@/generated/prisma";

interface ShowActionsProps {
  showId: string;
  currentStatus: TvShowStatus;
}

const statuses: { value: TvShowStatus; label: string }[] = [
  { value: "WATCHING", label: "Watching" },
  { value: "PAUSED", label: "Paused" },
  { value: "COMPLETED", label: "Completed" },
  { value: "DROPPED", label: "Dropped" },
  { value: "PLAN_TO_WATCH", label: "Plan to Watch" },
];

export default function ShowActions({ showId, currentStatus }: ShowActionsProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    startTransition(async () => {
      await updateShowStatus(showId, e.target.value as TvShowStatus);
    });
  }

  function handleRefresh() {
    startTransition(async () => {
      await refreshShowData(showId);
    });
  }

  function handleRemove() {
    if (!confirm("Remove this show and all its data?")) return;
    startTransition(async () => {
      await removeShow(showId);
      router.push("/tv");
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={currentStatus}
        onChange={handleStatusChange}
        disabled={isPending}
        className="rounded-lg border border-violet-200 bg-white px-3 py-2 text-sm text-stone-900 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-none disabled:opacity-50 dark:border-violet-800 dark:bg-stone-900 dark:text-stone-100"
      >
        {statuses.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={handleRefresh}
        disabled={isPending}
        className="rounded-lg border border-violet-200 px-3 py-2 text-sm text-violet-700 hover:bg-violet-50 disabled:opacity-50 dark:border-violet-800 dark:text-violet-300 dark:hover:bg-violet-900/30"
      >
        {isPending ? "Syncing..." : "Refresh from TMDB"}
      </button>
      <button
        type="button"
        onClick={handleRemove}
        disabled={isPending}
        className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
      >
        Remove
      </button>
    </div>
  );
}
