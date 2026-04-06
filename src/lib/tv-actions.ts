"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getShowDetails, getExternalIds, getSeasonDetails, searchShows as tmdbSearch, type TmdbSearchResult } from "@/lib/tmdb";
import { TvShowStatus, WatchMode } from "@/generated/prisma";

async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session.user;
}

async function getAllUserIds(): Promise<string[]> {
  const users = await prisma.user.findMany({ select: { id: true } });
  return users.map((u) => u.id);
}

// ── TMDB Search ──

export async function searchTmdbShows(query: string): Promise<TmdbSearchResult[]> {
  await requireAuth();
  return tmdbSearch(query);
}

// ── Channels ──

export async function getChannels() {
  return prisma.channel.findMany({ orderBy: { name: "asc" } });
}

export async function createChannel(formData: FormData) {
  await requireAuth();
  const name = (formData.get("name") as string)?.trim();
  if (!name) throw new Error("Channel name is required");

  await prisma.channel.create({ data: { name } });
  revalidatePath("/channels");
}

export async function deleteChannel(id: string) {
  await requireAuth();
  await prisma.channel.delete({ where: { id } });
  revalidatePath("/channels");
}

export async function updateChannel(id: string, formData: FormData) {
  const user = await requireAuth();
  if (user.role !== "ADMIN") throw new Error("Admin access required");
  const name = (formData.get("name") as string)?.trim();
  if (!name) throw new Error("Channel name is required");

  await prisma.channel.update({ where: { id }, data: { name } });
  revalidatePath("/channels");
}

// ── Watch Mode ──

export async function updateWatchMode(showId: string, watchMode: WatchMode) {
  const user = await requireAuth();
  await prisma.tvShow.update({
    where: { id: showId },
    data: {
      watchMode,
      ownerId: watchMode === "INDIVIDUAL" ? user.id : null,
    },
  });
  revalidatePath(`/tv/${showId}`);
  revalidatePath("/tv");
  revalidatePath("/dashboard");
}

// ── TV Shows ──

export async function addShowFromTmdb(tmdbId: number) {
  await requireAuth();

  // Check if already added
  const existing = await prisma.tvShow.findUnique({ where: { tmdbId } });
  if (existing) return existing;

  const [details, externalIds] = await Promise.all([
    getShowDetails(tmdbId),
    getExternalIds(tmdbId),
  ]);

  const show = await prisma.tvShow.create({
    data: {
      tmdbId,
      imdbId: externalIds.imdb_id,
      name: details.name,
      overview: details.overview,
      posterPath: details.poster_path,
      backdropPath: details.backdrop_path,
      tmdbRating: details.vote_average,
      firstAirDate: details.first_air_date ? new Date(details.first_air_date) : null,
      status: "WATCHING",
    },
  });

  // Fetch and store all seasons + episodes
  const seasonPromises = details.seasons
    .filter((s) => s.season_number > 0) // skip specials (season 0)
    .map((s) => syncSeason(show.id, tmdbId, s.season_number));

  await Promise.all(seasonPromises);

  revalidatePath("/tv");
  revalidatePath("/dashboard");
  return show;
}

async function syncSeason(showId: string, tmdbId: number, seasonNumber: number) {
  const seasonData = await getSeasonDetails(tmdbId, seasonNumber);

  const season = await prisma.tvSeason.upsert({
    where: { showId_seasonNumber: { showId, seasonNumber } },
    create: {
      tmdbId: seasonData.id,
      showId,
      seasonNumber,
      name: seasonData.name,
      overview: seasonData.overview,
      posterPath: seasonData.poster_path,
      airDate: seasonData.air_date ? new Date(seasonData.air_date) : null,
      episodeCount: seasonData.episodes.length,
    },
    update: {
      name: seasonData.name,
      episodeCount: seasonData.episodes.length,
    },
  });

  // Upsert episodes
  for (const ep of seasonData.episodes) {
    await prisma.tvEpisode.upsert({
      where: { seasonId_episodeNumber: { seasonId: season.id, episodeNumber: ep.episode_number } },
      create: {
        tmdbId: ep.id,
        seasonId: season.id,
        episodeNumber: ep.episode_number,
        name: ep.name,
        overview: ep.overview,
        airDate: ep.air_date ? new Date(ep.air_date) : null,
        tmdbRating: ep.vote_average,
        stillPath: ep.still_path,
      },
      update: {
        name: ep.name,
        overview: ep.overview,
        airDate: ep.air_date ? new Date(ep.air_date) : null,
        tmdbRating: ep.vote_average,
        stillPath: ep.still_path,
      },
    });
  }
}

export async function removeShow(showId: string) {
  await requireAuth();
  await prisma.tvShow.delete({ where: { id: showId } });
  revalidatePath("/tv");
  revalidatePath("/dashboard");
}

export async function updateShowStatus(showId: string, status: TvShowStatus) {
  await requireAuth();
  await prisma.tvShow.update({ where: { id: showId }, data: { status } });
  revalidatePath("/tv");
  revalidatePath("/dashboard");
}

export async function updateShowChannel(showId: string, channelId: string | null) {
  await requireAuth();
  await prisma.tvShow.update({
    where: { id: showId },
    data: { channelId: channelId || null },
  });
  revalidatePath(`/tv/${showId}`);
}

export async function rateShow(showId: string, rating: number) {
  const user = await requireAuth();
  if (rating < 1 || rating > 5) throw new Error("Rating must be 1-5");

  await prisma.tvShowRating.upsert({
    where: { showId_userId: { showId, userId: user.id } },
    create: { showId, userId: user.id, rating },
    update: { rating },
  });
  revalidatePath(`/tv/${showId}`);
  revalidatePath("/tv");
}

// ── Episodes ──

export async function toggleWatchedEpisode(episodeId: string) {
  const user = await requireAuth();

  const episode = await prisma.tvEpisode.findUniqueOrThrow({
    where: { id: episodeId },
    select: { season: { select: { show: { select: { watchMode: true } } } } },
  });
  const isHousehold = episode.season.show.watchMode === "HOUSEHOLD";

  const existing = await prisma.watchedEpisode.findUnique({
    where: { episodeId_userId: { episodeId, userId: user.id } },
  });

  if (existing) {
    if (isHousehold) {
      await prisma.watchedEpisode.deleteMany({ where: { episodeId } });
    } else {
      await prisma.watchedEpisode.delete({ where: { id: existing.id } });
    }
  } else {
    if (isHousehold) {
      const userIds = await getAllUserIds();
      await prisma.watchedEpisode.createMany({
        data: userIds.map((userId) => ({ episodeId, userId })),
        skipDuplicates: true,
      });
    } else {
      await prisma.watchedEpisode.create({
        data: { episodeId, userId: user.id },
      });
    }
  }

  revalidatePath("/tv");
  revalidatePath("/dashboard");
}

export async function markSeasonWatched(seasonId: string) {
  const user = await requireAuth();

  const season = await prisma.tvSeason.findUniqueOrThrow({
    where: { id: seasonId },
    select: { show: { select: { watchMode: true } } },
  });
  const isHousehold = season.show.watchMode === "HOUSEHOLD";

  const episodes = await prisma.tvEpisode.findMany({
    where: { seasonId },
    select: { id: true },
  });

  if (isHousehold) {
    const userIds = await getAllUserIds();
    await prisma.watchedEpisode.createMany({
      data: episodes.flatMap((ep) =>
        userIds.map((userId) => ({ episodeId: ep.id, userId })),
      ),
      skipDuplicates: true,
    });
  } else {
    for (const ep of episodes) {
      await prisma.watchedEpisode.upsert({
        where: { episodeId_userId: { episodeId: ep.id, userId: user.id } },
        create: { episodeId: ep.id, userId: user.id },
        update: {},
      });
    }
  }

  revalidatePath("/tv");
  revalidatePath("/dashboard");
}

// ── Queries ──

export async function getUpNextEpisodes(limit = 10) {
  const user = await requireAuth();
  const now = new Date();

  // Get all shows the user is watching (household or owned by them)
  const shows = await prisma.tvShow.findMany({
    where: {
      status: "WATCHING",
      OR: [{ watchMode: "HOUSEHOLD" }, { ownerId: user.id }],
    },
    include: {
      seasons: {
        orderBy: { seasonNumber: "asc" },
        include: {
          episodes: {
            where: {
              airDate: { lte: now },
              watchedBy: { none: { userId: user.id } },
            },
            orderBy: { episodeNumber: "asc" },
            take: 1,
            include: {
              season: {
                select: {
                  seasonNumber: true,
                  show: { select: { id: true, name: true, posterPath: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  // Flatten to get the first unwatched aired episode per show
  const episodes = shows
    .flatMap((show) => show.seasons.flatMap((season) => season.episodes))
    .slice(0, limit);

  return episodes;
}

export async function getShowsWithStatus(status: TvShowStatus) {
  return prisma.tvShow.findMany({
    where: { status },
    include: {
      channel: true,
      ratings: true,
      seasons: {
        orderBy: { seasonNumber: "asc" },
        include: {
          _count: { select: { episodes: true } },
        },
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function getShowById(showId: string) {
  const user = await requireAuth();

  return prisma.tvShow.findUnique({
    where: { id: showId },
    include: {
      channel: true,
      owner: { select: { id: true, name: true } },
      ratings: true,
      seasons: {
        orderBy: { seasonNumber: "asc" },
        include: {
          episodes: {
            orderBy: { episodeNumber: "asc" },
            include: {
              watchedBy: {
                where: { userId: user.id },
              },
            },
          },
        },
      },
    },
  });
}

export async function refreshShowData(showId: string) {
  await requireAuth();

  const show = await prisma.tvShow.findUnique({ where: { id: showId } });
  if (!show) throw new Error("Show not found");

  const [details, externalIds] = await Promise.all([
    getShowDetails(show.tmdbId),
    getExternalIds(show.tmdbId),
  ]);

  await prisma.tvShow.update({
    where: { id: showId },
    data: {
      imdbId: externalIds.imdb_id,
      name: details.name,
      overview: details.overview,
      posterPath: details.poster_path,
      backdropPath: details.backdrop_path,
      tmdbRating: details.vote_average,
    },
  });

  // Sync seasons
  const seasonPromises = details.seasons
    .filter((s) => s.season_number > 0)
    .map((s) => syncSeason(showId, show.tmdbId, s.season_number));

  await Promise.all(seasonPromises);

  revalidatePath(`/tv/${showId}`);
  revalidatePath("/tv");
  revalidatePath("/dashboard");
}
