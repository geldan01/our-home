"use client";

import { useState, useTransition } from "react";
import { markSeasonWatched } from "@/lib/tv-actions";
import EpisodeRow from "./episode-row";

interface SeasonSectionProps {
  showId: string;
  season: {
    id: string;
    seasonNumber: number;
    name: string | null;
    episodeCount: number;
    episodes: {
      id: string;
      episodeNumber: number;
      name: string | null;
      airDate: Date | null;
      tmdbRating: number | null;
      watched: boolean;
    }[];
  };
  defaultOpen?: boolean;
  readOnly?: boolean;
}

export default function SeasonSection({ showId, season, defaultOpen = false, readOnly = false }: SeasonSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [isPending, startTransition] = useTransition();

  const watchedCount = season.episodes.filter((e) => e.watched).length;
  const totalCount = season.episodes.length;
  const allWatched = totalCount > 0 && watchedCount === totalCount;

  function handleMarkAll() {
    startTransition(async () => {
      await markSeasonWatched(season.id);
    });
  }

  return (
    <div className="rounded-xl border border-violet-200/80 bg-white dark:border-violet-900/40 dark:bg-stone-900/60">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-stone-800 dark:text-stone-200">
            {season.name ?? `Season ${season.seasonNumber}`}
          </span>
          <span className="text-xs text-stone-400 dark:text-stone-500">
            {watchedCount}/{totalCount} watched
          </span>
        </div>
        <svg
          className={`h-4 w-4 text-stone-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="border-t border-violet-100 px-5 pb-4 dark:border-violet-900/30">
          {!readOnly && !allWatched && (
            <div className="flex justify-end pt-2 pb-1">
              <button
                type="button"
                onClick={handleMarkAll}
                disabled={isPending}
                className="text-xs text-violet-600 hover:text-violet-800 disabled:opacity-50 dark:text-violet-400 dark:hover:text-violet-200"
              >
                {isPending ? "Marking..." : "Mark all watched"}
              </button>
            </div>
          )}
          {season.episodes.map((ep) => (
            <EpisodeRow
              key={ep.id}
              showId={showId}
              seasonNumber={season.seasonNumber}
              episode={ep}
              readOnly={readOnly}
            />
          ))}
        </div>
      )}
    </div>
  );
}
