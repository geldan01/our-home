import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getShowById, getChannels } from "@/lib/tv-actions";
import ShowStarRating from "./show-star-rating";
import ChannelSelector from "./channel-selector";
import ShowActions from "./show-actions";
import SeasonSection from "./season-section";

export default async function ShowDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await params;
  const [show, channels] = await Promise.all([getShowById(id), getChannels()]);
  if (!show) notFound();

  const user = session.user;
  const userRating = show.ratings.find((r) => r.userId === user.id);
  const avgRating =
    show.ratings.length > 0
      ? show.ratings.reduce((sum, r) => sum + r.rating, 0) / show.ratings.length
      : null;

  // Find which season has the next unwatched episode to auto-open it
  let autoOpenSeason: number | null = null;
  for (const season of show.seasons) {
    const hasUnwatched = season.episodes.some(
      (ep) => ep.airDate && ep.airDate <= new Date() && ep.watchedBy.length === 0
    );
    if (hasUnwatched) {
      autoOpenSeason = season.seasonNumber;
      break;
    }
  }

  return (
    <div className="flex min-h-full flex-1 items-start justify-center px-4 py-10 sm:px-6">
      <div className="w-full max-w-4xl space-y-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-stone-400 dark:text-stone-500">
          <Link href="/tv" className="hover:text-violet-600 dark:hover:text-violet-400">
            TV Shows
          </Link>
          <span>/</span>
          <span className="text-stone-700 dark:text-stone-300">{show.name}</span>
        </div>

        {/* Show header */}
        <div className="flex gap-6">
          {show.posterPath ? (
            <img
              src={`https://image.tmdb.org/t/p/w342${show.posterPath}`}
              alt={show.name}
              className="h-64 w-44 shrink-0 rounded-xl object-cover shadow-lg"
            />
          ) : (
            <div className="flex h-64 w-44 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-lg text-violet-400 shadow-lg dark:bg-violet-900/40">
              No Image
            </div>
          )}
          <div className="min-w-0 flex-1 space-y-4">
            <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-100">
              {show.name}
            </h1>

            {/* Ratings */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-stone-500 dark:text-stone-400">
              {show.tmdbRating != null && (
                <span>TMDB {show.tmdbRating.toFixed(1)}/10</span>
              )}
              {show.imdbId && (
                <a
                  href={`https://www.imdb.com/title/${show.imdbId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-600 hover:underline dark:text-amber-400"
                >
                  IMDb
                </a>
              )}
              {avgRating != null && (
                <span>
                  Household avg: {avgRating.toFixed(1)}/5
                </span>
              )}
              {show.firstAirDate && (
                <span>
                  First aired: {show.firstAirDate.toLocaleDateString()}
                </span>
              )}
            </div>

            {/* Your rating */}
            <div>
              <p className="mb-1 text-xs font-medium text-stone-500 dark:text-stone-400">
                Your Rating
              </p>
              <ShowStarRating showId={show.id} currentRating={userRating?.rating ?? null} />
            </div>

            {/* Channel */}
            <div>
              <p className="mb-1 text-xs font-medium text-stone-500 dark:text-stone-400">
                Watching on
              </p>
              <ChannelSelector
                showId={show.id}
                currentChannelId={show.channelId}
                channels={channels}
              />
            </div>

            {/* Status and actions */}
            <ShowActions showId={show.id} currentStatus={show.status} />
          </div>
        </div>

        {/* Overview */}
        {show.overview && (
          <div className="rounded-xl border border-stone-200/80 bg-white p-5 dark:border-stone-800 dark:bg-stone-900/60">
            <h2 className="mb-2 text-sm font-semibold text-stone-700 dark:text-stone-300">
              Overview
            </h2>
            <p className="text-sm leading-relaxed text-stone-600 dark:text-stone-400">
              {show.overview}
            </p>
          </div>
        )}

        {/* Seasons */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200">
            Seasons ({show.seasons.length})
          </h2>
          {show.seasons.map((season) => (
            <SeasonSection
              key={season.id}
              showId={show.id}
              season={{
                id: season.id,
                seasonNumber: season.seasonNumber,
                name: season.name,
                episodeCount: season.episodes.length,
                episodes: season.episodes.map((ep) => ({
                  id: ep.id,
                  episodeNumber: ep.episodeNumber,
                  name: ep.name,
                  airDate: ep.airDate,
                  tmdbRating: ep.tmdbRating,
                  watched: ep.watchedBy.length > 0,
                })),
              }}
              defaultOpen={season.seasonNumber === autoOpenSeason}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
