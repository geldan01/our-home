"use client";

import { useTransition } from "react";
import { toggleWatchedEpisode } from "@/lib/tv-actions";
import Link from "next/link";

interface EpisodeRowProps {
  showId: string;
  seasonNumber: number;
  episode: {
    id: string;
    episodeNumber: number;
    name: string | null;
    airDate: Date | null;
    tmdbRating: number | null;
    watched: boolean;
  };
  readOnly?: boolean;
}

export default function EpisodeRow({ showId, seasonNumber, episode, readOnly = false }: EpisodeRowProps) {
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      await toggleWatchedEpisode(episode.id);
    });
  }

  const aired = episode.airDate && episode.airDate <= new Date();

  return (
    <div className="flex items-center gap-3 border-b border-stone-100 py-2.5 last:border-0 dark:border-stone-800">
      {readOnly ? (
        <div
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-stone-200 dark:border-stone-700"
          style={{
            backgroundColor: episode.watched ? "rgb(168 162 158)" : "transparent",
          }}
        >
          {episode.watched && (
            <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={handleToggle}
          disabled={isPending}
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-violet-300 transition-colors disabled:opacity-50 dark:border-violet-700"
          style={{
            backgroundColor: episode.watched ? "rgb(139 92 246)" : "transparent",
          }}
          aria-label={episode.watched ? "Mark unwatched" : "Mark watched"}
        >
          {episode.watched && (
            <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
      )}
      <Link
        href={`/tv/${showId}/season/${seasonNumber}/episode/${episode.episodeNumber}`}
        className="flex min-w-0 flex-1 items-center gap-2 hover:text-violet-700 dark:hover:text-violet-300"
      >
        <span className="w-8 shrink-0 text-xs text-stone-400 dark:text-stone-500">
          E{episode.episodeNumber}
        </span>
        <span className={`truncate text-sm ${episode.watched ? "text-stone-400 line-through dark:text-stone-500" : "text-stone-800 dark:text-stone-200"}`}>
          {episode.name ?? `Episode ${episode.episodeNumber}`}
        </span>
      </Link>
      <div className="flex items-center gap-3 text-xs text-stone-400 dark:text-stone-500">
        {episode.tmdbRating != null && episode.tmdbRating > 0 && (
          <span>TMDB {episode.tmdbRating.toFixed(1)}</span>
        )}
        {episode.airDate ? (
          <span className={!aired ? "font-medium text-violet-500" : ""}>
            {episode.airDate.toLocaleDateString()}
          </span>
        ) : (
          <span>TBA</span>
        )}
      </div>
    </div>
  );
}
