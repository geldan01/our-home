import Link from "next/link";

interface UpNextEpisode {
  id: string;
  episodeNumber: number;
  name: string | null;
  airDate: Date | null;
  season: {
    seasonNumber: number;
    show: { id: string; name: string; posterPath: string | null };
  };
}

export default function TvWidget({ episodes }: { episodes: UpNextEpisode[] }) {
  return (
    <Link
      href="/tv"
      className="group relative block overflow-hidden rounded-2xl border border-violet-200/80 bg-linear-to-br from-violet-50 to-indigo-50 p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg dark:border-violet-900/40 dark:from-violet-950/40 dark:to-indigo-950/30"
    >
      <div className="absolute bottom-0 left-0 h-20 w-20 -translate-x-6 translate-y-6 rounded-full bg-violet-200/30 dark:bg-violet-800/20" />
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/15 text-2xl ring-1 ring-violet-500/20 dark:bg-violet-400/10 dark:ring-violet-400/20">
          <span role="img" aria-label="TV">&#128250;</span>
        </div>
        <div>
          <h2 className="font-semibold text-violet-900 dark:text-violet-100">
            TV Shows
          </h2>
          <p className="text-xs text-violet-700/60 dark:text-violet-300/50">
            Up next to watch
          </p>
        </div>
      </div>

      {episodes.length > 0 ? (
        <ul className="mt-5 space-y-3">
          {episodes.slice(0, 4).map((ep) => (
            <li key={ep.id} className="flex items-start gap-3">
              {ep.season.show.posterPath ? (
                <img
                  src={`https://image.tmdb.org/t/p/w92${ep.season.show.posterPath}`}
                  alt=""
                  className="h-12 w-8 shrink-0 rounded object-cover"
                />
              ) : (
                <div className="flex h-12 w-8 shrink-0 items-center justify-center rounded bg-violet-200/50 text-xs text-violet-400 dark:bg-violet-800/40">
                  TV
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-violet-900 dark:text-violet-100">
                  {ep.season.show.name}
                </p>
                <p className="truncate text-xs text-violet-600/70 dark:text-violet-400/60">
                  S{ep.season.seasonNumber}E{ep.episodeNumber}
                  {ep.name ? ` — ${ep.name}` : ""}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-5 flex flex-col items-center justify-center rounded-xl border border-dashed border-violet-300/60 py-8 dark:border-violet-700/40">
          <p className="text-sm font-medium text-violet-400 dark:text-violet-500">
            All caught up!
          </p>
          <p className="mt-1 text-xs text-violet-300 dark:text-violet-600">
            No new episodes available
          </p>
        </div>
      )}

      <p className="mt-5 text-xs font-medium text-violet-600/50 transition-colors group-hover:text-violet-700 dark:text-violet-400/40 dark:group-hover:text-violet-300">
        View all &rarr;
      </p>
    </Link>
  );
}
