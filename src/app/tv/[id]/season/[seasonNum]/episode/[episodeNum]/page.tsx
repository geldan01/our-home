import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import EpisodeWatchedToggle from "./episode-watched-toggle";

export default async function EpisodeDetailPage({
  params,
}: {
  params: Promise<{ id: string; seasonNum: string; episodeNum: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id: showId, seasonNum, episodeNum } = await params;
  const user = session.user;

  const show = await prisma.tvShow.findUnique({
    where: { id: showId },
    select: { id: true, name: true, posterPath: true },
  });
  if (!show) notFound();

  const season = await prisma.tvSeason.findUnique({
    where: {
      showId_seasonNumber: { showId, seasonNumber: parseInt(seasonNum) },
    },
    select: { id: true, seasonNumber: true, name: true },
  });
  if (!season) notFound();

  const episode = await prisma.tvEpisode.findUnique({
    where: {
      seasonId_episodeNumber: {
        seasonId: season.id,
        episodeNumber: parseInt(episodeNum),
      },
    },
    include: {
      watchedBy: { where: { userId: user.id } },
    },
  });
  if (!episode) notFound();

  const watched = episode.watchedBy.length > 0;
  const aired = episode.airDate && episode.airDate <= new Date();

  return (
    <div className="flex min-h-full flex-1 items-start justify-center px-4 py-10 sm:px-6">
      <div className="w-full max-w-3xl space-y-6">
        {/* Breadcrumb */}
        <div className="flex flex-wrap items-center gap-2 text-sm text-stone-400 dark:text-stone-500">
          <Link href="/tv" className="hover:text-violet-600 dark:hover:text-violet-400">
            TV Shows
          </Link>
          <span>/</span>
          <Link href={`/tv/${show.id}`} className="hover:text-violet-600 dark:hover:text-violet-400">
            {show.name}
          </Link>
          <span>/</span>
          <span className="text-stone-700 dark:text-stone-300">
            S{season.seasonNumber}E{episode.episodeNumber}
          </span>
        </div>

        {/* Episode header */}
        <div className="space-y-4">
          {episode.stillPath && (
            <img
              src={`https://image.tmdb.org/t/p/w500${episode.stillPath}`}
              alt={episode.name ?? `Episode ${episode.episodeNumber}`}
              className="w-full rounded-xl object-cover shadow-lg"
              style={{ maxHeight: 360 }}
            />
          )}

          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-violet-600 dark:text-violet-400">
                {show.name} &middot; {season.name ?? `Season ${season.seasonNumber}`}
              </p>
              <h1 className="mt-1 text-2xl font-bold text-stone-900 dark:text-stone-100">
                E{episode.episodeNumber} &mdash; {episode.name ?? `Episode ${episode.episodeNumber}`}
              </h1>
            </div>
            <EpisodeWatchedToggle episodeId={episode.id} watched={watched} />
          </div>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-stone-500 dark:text-stone-400">
            {episode.airDate && (
              <span>
                {aired ? "Aired" : "Airs"} {episode.airDate.toLocaleDateString()}
              </span>
            )}
            {episode.tmdbRating != null && episode.tmdbRating > 0 && (
              <span>TMDB {episode.tmdbRating.toFixed(1)}/10</span>
            )}
            {watched && (
              <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                Watched
              </span>
            )}
            {!aired && (
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                Not yet aired
              </span>
            )}
          </div>
        </div>

        {/* Overview */}
        {episode.overview && (
          <div className="rounded-xl border border-stone-200/80 bg-white p-5 dark:border-stone-800 dark:bg-stone-900/60">
            <p className="text-sm leading-relaxed text-stone-600 dark:text-stone-400">
              {episode.overview}
            </p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4">
          {episode.episodeNumber > 1 ? (
            <Link
              href={`/tv/${show.id}/season/${season.seasonNumber}/episode/${episode.episodeNumber - 1}`}
              className="text-sm text-violet-600 hover:text-violet-800 dark:text-violet-400 dark:hover:text-violet-200"
            >
              &larr; Previous episode
            </Link>
          ) : (
            <span />
          )}
          <Link
            href={`/tv/${show.id}`}
            className="text-sm text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300"
          >
            Back to show
          </Link>
          <Link
            href={`/tv/${show.id}/season/${season.seasonNumber}/episode/${episode.episodeNumber + 1}`}
            className="text-sm text-violet-600 hover:text-violet-800 dark:text-violet-400 dark:hover:text-violet-200"
          >
            Next episode &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
