import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AddShowSearch from "./add-show-search";

export default async function TvPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const user = session.user;
  const now = new Date();
  const { filter = "mine" } = await searchParams;
  const showAll = filter === "all";

  const ownershipFilter = showAll
    ? {}
    : { OR: [{ watchMode: "HOUSEHOLD" as const }, { ownerId: user.id }] };

  const watchingShows = await prisma.tvShow.findMany({
    where: {
      status: "WATCHING",
      ...ownershipFilter,
    },
    include: {
      channel: true,
      ratings: true,
      seasons: {
        orderBy: { seasonNumber: "asc" },
        include: {
          episodes: {
            orderBy: { episodeNumber: "asc" },
            include: {
              watchedBy: { where: { userId: user.id } },
            },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  // Compute up-next per show
  const upNext = watchingShows
    .map((show) => {
      for (const season of show.seasons) {
        for (const ep of season.episodes) {
          if (ep.airDate && ep.airDate <= now && ep.watchedBy.length === 0) {
            return { show, episode: ep, season };
          }
        }
      }
      return null;
    })
    .filter(Boolean) as { show: typeof watchingShows[number]; episode: typeof watchingShows[number]["seasons"][number]["episodes"][number]; season: typeof watchingShows[number]["seasons"][number] }[];

  // Other statuses
  const otherShows = await prisma.tvShow.findMany({
    where: {
      status: { not: "WATCHING" },
      ...ownershipFilter,
    },
    include: { channel: true, ratings: true },
    orderBy: { name: "asc" },
  });

  function avgRating(ratings: { rating: number }[]) {
    if (ratings.length === 0) return null;
    return ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
  }

  function showProgress(show: typeof watchingShows[number]) {
    const totalEps = show.seasons.reduce((sum, s) => sum + s.episodes.length, 0);
    const watchedEps = show.seasons.reduce(
      (sum, s) => sum + s.episodes.filter((e) => e.watchedBy.length > 0).length,
      0
    );
    return { watchedEps, totalEps };
  }

  return (
    <div className="flex min-h-full flex-1 items-start justify-center px-4 py-10 sm:px-6">
      <div className="w-full max-w-5xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-violet-200/60 pb-4 dark:border-violet-900/30">
          <div>
            <h1 className="text-2xl font-bold text-violet-900 dark:text-violet-100">
              TV Shows
            </h1>
            <p className="mt-1 text-sm text-violet-600/70 dark:text-violet-400/60">
              Track what your household is watching
            </p>
          </div>
          <Link
            href="/channels"
            className="rounded-lg border border-violet-200 px-4 py-2 text-sm text-violet-700 hover:bg-violet-50 dark:border-violet-800 dark:text-violet-300 dark:hover:bg-violet-900/30"
          >
            Channels
          </Link>
        </div>

        {/* Filter toggle */}
        <div className="inline-flex rounded-lg border border-violet-200 dark:border-violet-800">
          <Link
            href="/tv"
            className={`rounded-l-lg px-4 py-2 text-sm font-medium transition-colors ${
              !showAll
                ? "bg-violet-600 text-white dark:bg-violet-500"
                : "bg-white text-violet-700 hover:bg-violet-50 dark:bg-stone-900 dark:text-violet-300 dark:hover:bg-violet-900/30"
            }`}
          >
            My Shows
          </Link>
          <Link
            href="/tv?filter=all"
            className={`rounded-r-lg border-l border-violet-200 px-4 py-2 text-sm font-medium transition-colors dark:border-violet-800 ${
              showAll
                ? "bg-violet-600 text-white dark:bg-violet-500"
                : "bg-white text-violet-700 hover:bg-violet-50 dark:bg-stone-900 dark:text-violet-300 dark:hover:bg-violet-900/30"
            }`}
          >
            All Shows
          </Link>
        </div>

        {/* Search to add */}
        <AddShowSearch />

        {/* Up Next */}
        {upNext.length > 0 && (
          <section>
            <h2 className="mb-4 text-lg font-semibold text-violet-900 dark:text-violet-100">
              Up Next
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {upNext.map(({ show, episode, season }) => (
                <Link
                  key={show.id}
                  href={`/tv/${show.id}`}
                  className="group flex gap-3 rounded-xl border border-violet-200/80 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-violet-900/40 dark:bg-stone-900/60"
                >
                  {show.posterPath ? (
                    <Image
                      src={`https://image.tmdb.org/t/p/w185${show.posterPath}`}
                      alt=""
                      width={64}
                      height={96}
                      className="h-24 w-16 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-24 w-16 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-sm text-violet-400 dark:bg-violet-900/40">
                      TV
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-stone-900 dark:text-stone-100">
                      {show.name}
                    </p>
                    <p className="mt-1 text-xs text-violet-600 dark:text-violet-400">
                      S{season.seasonNumber}E{episode.episodeNumber}
                      {episode.name ? ` — ${episode.name}` : ""}
                    </p>
                    {episode.airDate && (
                      <p className="mt-0.5 text-xs text-stone-400 dark:text-stone-500">
                        Aired {episode.airDate.toLocaleDateString()}
                      </p>
                    )}
                    {show.channel && (
                      <p className="mt-1 text-xs text-stone-400 dark:text-stone-500">
                        on {show.channel.name}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Currently Watching */}
        <section>
          <h2 className="mb-4 text-lg font-semibold text-violet-900 dark:text-violet-100">
            Currently Watching
          </h2>
          {watchingShows.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {watchingShows.map((show) => {
                const { watchedEps, totalEps } = showProgress(show);
                const pct = totalEps > 0 ? Math.round((watchedEps / totalEps) * 100) : 0;
                const avg = avgRating(show.ratings);
                return (
                  <Link
                    key={show.id}
                    href={`/tv/${show.id}`}
                    className="group overflow-hidden rounded-xl border border-violet-200/80 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-violet-900/40 dark:bg-stone-900/60"
                  >
                    <div className="flex gap-3 p-4">
                      {show.posterPath ? (
                        <Image
                          src={`https://image.tmdb.org/t/p/w185${show.posterPath}`}
                          alt=""
                          width={75}
                          height={112}
                          className="h-28 w-18.75 shrink-0 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-28 w-18.75 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-sm text-violet-400 dark:bg-violet-900/40">
                          TV
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-stone-900 dark:text-stone-100">
                          {show.name}
                        </p>
                        <div className="mt-1 flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
                          {show.tmdbRating != null && (
                            <span>TMDB {show.tmdbRating.toFixed(1)}</span>
                          )}
                          {avg != null && (
                            <span className="text-amber-500">
                              {"★".repeat(Math.round(avg))}{"☆".repeat(5 - Math.round(avg))}
                            </span>
                          )}
                        </div>
                        {show.channel && (
                          <p className="mt-1 text-xs text-stone-400 dark:text-stone-500">
                            {show.channel.name}
                          </p>
                        )}
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
                            <span>{watchedEps}/{totalEps} episodes</span>
                            <span>{pct}%</span>
                          </div>
                          <div className="mt-1 h-1.5 w-full rounded-full bg-violet-200/60 dark:bg-violet-800/40">
                            <div
                              className="h-1.5 rounded-full bg-violet-500 transition-all dark:bg-violet-400"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-violet-300/60 py-12 text-center dark:border-violet-700/40">
              <p className="text-sm text-violet-400 dark:text-violet-500">
                No shows yet. Search above to add one!
              </p>
            </div>
          )}
        </section>

        {/* Other shows */}
        {otherShows.length > 0 && (
          <section>
            <h2 className="mb-4 text-lg font-semibold text-stone-700 dark:text-stone-300">
              Other Shows
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {otherShows.map((show) => {
                const avg = avgRating(show.ratings);
                return (
                  <Link
                    key={show.id}
                    href={`/tv/${show.id}`}
                    className="flex items-center gap-3 rounded-xl border border-stone-200/80 bg-white p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-stone-800 dark:bg-stone-900/60"
                  >
                    {show.posterPath ? (
                      <Image
                        src={`https://image.tmdb.org/t/p/w92${show.posterPath}`}
                        alt=""
                        width={44}
                        height={64}
                        className="h-16 w-11 shrink-0 rounded object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-11 shrink-0 items-center justify-center rounded bg-stone-100 text-xs text-stone-400 dark:bg-stone-800">
                        TV
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-stone-900 dark:text-stone-100">
                        {show.name}
                      </p>
                      <p className="text-xs text-stone-500 dark:text-stone-400">
                        {show.status.replace(/_/g, " ").toLowerCase()}
                        {avg != null && (
                          <span className="ml-2 text-amber-500">
                            {"★".repeat(Math.round(avg))}
                          </span>
                        )}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
