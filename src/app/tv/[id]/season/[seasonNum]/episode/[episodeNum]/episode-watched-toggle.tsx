"use client";

import { useTransition } from "react";
import { toggleWatchedEpisode } from "@/lib/tv-actions";

interface EpisodeWatchedToggleProps {
  episodeId: string;
  watched: boolean;
}

export default function EpisodeWatchedToggle({ episodeId, watched }: EpisodeWatchedToggleProps) {
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      await toggleWatchedEpisode(episodeId);
    });
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      className={`rounded-lg px-5 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 ${
        watched
          ? "border border-stone-300 bg-stone-100 text-stone-600 hover:bg-stone-200 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700"
          : "bg-violet-600 text-white hover:bg-violet-700 dark:bg-violet-500 dark:hover:bg-violet-600"
      }`}
    >
      {isPending ? "Updating..." : watched ? "Mark as Unwatched" : "Mark as Watched"}
    </button>
  );
}
