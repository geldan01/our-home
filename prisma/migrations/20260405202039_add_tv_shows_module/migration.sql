-- CreateEnum
CREATE TYPE "TvShowStatus" AS ENUM ('WATCHING', 'PAUSED', 'COMPLETED', 'DROPPED', 'PLAN_TO_WATCH');

-- CreateTable
CREATE TABLE "Channel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Channel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TvShow" (
    "id" TEXT NOT NULL,
    "tmdbId" INTEGER NOT NULL,
    "imdbId" TEXT,
    "name" TEXT NOT NULL,
    "overview" TEXT,
    "posterPath" TEXT,
    "backdropPath" TEXT,
    "status" "TvShowStatus" NOT NULL DEFAULT 'PLAN_TO_WATCH',
    "tmdbRating" DOUBLE PRECISION,
    "imdbRating" DOUBLE PRECISION,
    "firstAirDate" TIMESTAMP(3),
    "channelId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TvShow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TvSeason" (
    "id" TEXT NOT NULL,
    "tmdbId" INTEGER,
    "showId" TEXT NOT NULL,
    "seasonNumber" INTEGER NOT NULL,
    "name" TEXT,
    "overview" TEXT,
    "posterPath" TEXT,
    "airDate" TIMESTAMP(3),
    "episodeCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TvSeason_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TvEpisode" (
    "id" TEXT NOT NULL,
    "tmdbId" INTEGER,
    "seasonId" TEXT NOT NULL,
    "episodeNumber" INTEGER NOT NULL,
    "name" TEXT,
    "overview" TEXT,
    "airDate" TIMESTAMP(3),
    "tmdbRating" DOUBLE PRECISION,
    "stillPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TvEpisode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TvShowRating" (
    "id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "showId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "TvShowRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WatchedEpisode" (
    "id" TEXT NOT NULL,
    "episodeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "watchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WatchedEpisode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Channel_name_key" ON "Channel"("name");

-- CreateIndex
CREATE UNIQUE INDEX "TvShow_tmdbId_key" ON "TvShow"("tmdbId");

-- CreateIndex
CREATE UNIQUE INDEX "TvSeason_showId_seasonNumber_key" ON "TvSeason"("showId", "seasonNumber");

-- CreateIndex
CREATE UNIQUE INDEX "TvEpisode_seasonId_episodeNumber_key" ON "TvEpisode"("seasonId", "episodeNumber");

-- CreateIndex
CREATE UNIQUE INDEX "TvShowRating_showId_userId_key" ON "TvShowRating"("showId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "WatchedEpisode_episodeId_userId_key" ON "WatchedEpisode"("episodeId", "userId");

-- AddForeignKey
ALTER TABLE "TvShow" ADD CONSTRAINT "TvShow_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TvSeason" ADD CONSTRAINT "TvSeason_showId_fkey" FOREIGN KEY ("showId") REFERENCES "TvShow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TvEpisode" ADD CONSTRAINT "TvEpisode_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "TvSeason"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TvShowRating" ADD CONSTRAINT "TvShowRating_showId_fkey" FOREIGN KEY ("showId") REFERENCES "TvShow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TvShowRating" ADD CONSTRAINT "TvShowRating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WatchedEpisode" ADD CONSTRAINT "WatchedEpisode_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "TvEpisode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WatchedEpisode" ADD CONSTRAINT "WatchedEpisode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
