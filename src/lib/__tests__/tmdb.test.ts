import { describe, it, expect, vi, beforeEach } from "vitest";
import { posterUrl, stillUrl, backdropUrl, searchShows, getShowDetails, getExternalIds, getSeasonDetails } from "../tmdb";

describe("Image URL helpers", () => {
  describe("posterUrl", () => {
    it("returns null when path is null", () => {
      expect(posterUrl(null)).toBeNull();
    });

    it("returns full URL with default size w342", () => {
      expect(posterUrl("/abc123.jpg")).toBe(
        "https://image.tmdb.org/t/p/w342/abc123.jpg"
      );
    });

    it("respects custom size parameter", () => {
      expect(posterUrl("/abc123.jpg", "w185")).toBe(
        "https://image.tmdb.org/t/p/w185/abc123.jpg"
      );
      expect(posterUrl("/abc123.jpg", "w500")).toBe(
        "https://image.tmdb.org/t/p/w500/abc123.jpg"
      );
    });
  });

  describe("stillUrl", () => {
    it("returns null when path is null", () => {
      expect(stillUrl(null)).toBeNull();
    });

    it("returns full URL with default size w300", () => {
      expect(stillUrl("/still.jpg")).toBe(
        "https://image.tmdb.org/t/p/w300/still.jpg"
      );
    });

    it("respects custom size parameter", () => {
      expect(stillUrl("/still.jpg", "w185")).toBe(
        "https://image.tmdb.org/t/p/w185/still.jpg"
      );
      expect(stillUrl("/still.jpg", "w500")).toBe(
        "https://image.tmdb.org/t/p/w500/still.jpg"
      );
    });
  });

  describe("backdropUrl", () => {
    it("returns null when path is null", () => {
      expect(backdropUrl(null)).toBeNull();
    });

    it("returns full URL with default size w780", () => {
      expect(backdropUrl("/backdrop.jpg")).toBe(
        "https://image.tmdb.org/t/p/w780/backdrop.jpg"
      );
    });

    it("respects custom size parameter", () => {
      expect(backdropUrl("/backdrop.jpg", "w1280")).toBe(
        "https://image.tmdb.org/t/p/w1280/backdrop.jpg"
      );
    });
  });
});

describe("TMDB API functions", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubEnv("TMDB_API_KEY", "test-api-key");
  });

  describe("searchShows", () => {
    it("returns empty array for empty query", async () => {
      const results = await searchShows("");
      expect(results).toEqual([]);
    });

    it("returns empty array for whitespace-only query", async () => {
      const results = await searchShows("   ");
      expect(results).toEqual([]);
    });

    it("fetches search results from TMDB and limits to 10", async () => {
      const mockResults = Array.from({ length: 15 }, (_, i) => ({
        id: i + 1,
        name: `Show ${i + 1}`,
        overview: "A show",
        poster_path: null,
        backdrop_path: null,
        first_air_date: "2024-01-01",
        vote_average: 7.5,
      }));

      vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            page: 1,
            results: mockResults,
            total_results: 15,
            total_pages: 1,
          }),
      } as Response);

      const results = await searchShows("test");

      expect(results).toHaveLength(10);
      expect(results[0].name).toBe("Show 1");

      const fetchCall = vi.mocked(globalThis.fetch).mock.calls[0][0] as string;
      expect(fetchCall).toContain("/search/tv");
      expect(fetchCall).toContain("query=test");
      expect(fetchCall).toContain("api_key=test-api-key");
    });

    it("throws on API error", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
      } as Response);

      await expect(searchShows("test")).rejects.toThrow(
        "TMDB API error: 401 Unauthorized"
      );
    });
  });

  describe("getShowDetails", () => {
    it("fetches show details by tmdbId", async () => {
      const mockShow = {
        id: 1399,
        name: "Breaking Bad",
        overview: "A chemistry teacher...",
        poster_path: "/poster.jpg",
        backdrop_path: "/backdrop.jpg",
        first_air_date: "2008-01-20",
        vote_average: 8.9,
        status: "Ended",
        number_of_seasons: 5,
        number_of_episodes: 62,
        seasons: [],
      };

      vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockShow),
      } as Response);

      const result = await getShowDetails(1399);

      expect(result.name).toBe("Breaking Bad");
      expect(result.vote_average).toBe(8.9);

      const fetchCall = vi.mocked(globalThis.fetch).mock.calls[0][0] as string;
      expect(fetchCall).toContain("/tv/1399");
    });
  });

  describe("getExternalIds", () => {
    it("fetches external IDs including IMDB", async () => {
      const mockIds = {
        imdb_id: "tt0903747",
        tvdb_id: 81189,
      };

      vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockIds),
      } as Response);

      const result = await getExternalIds(1399);

      expect(result.imdb_id).toBe("tt0903747");
      expect(result.tvdb_id).toBe(81189);

      const fetchCall = vi.mocked(globalThis.fetch).mock.calls[0][0] as string;
      expect(fetchCall).toContain("/tv/1399/external_ids");
    });
  });

  describe("getSeasonDetails", () => {
    it("fetches season with episodes", async () => {
      const mockSeason = {
        id: 3572,
        season_number: 1,
        name: "Season 1",
        overview: "The first season...",
        poster_path: "/season1.jpg",
        air_date: "2008-01-20",
        episodes: [
          {
            id: 62085,
            episode_number: 1,
            name: "Pilot",
            overview: "Walter White...",
            air_date: "2008-01-20",
            vote_average: 8.1,
            still_path: "/pilot.jpg",
            season_number: 1,
          },
          {
            id: 62086,
            episode_number: 2,
            name: "Cat's in the Bag...",
            overview: "After their...",
            air_date: "2008-01-27",
            vote_average: 8.0,
            still_path: "/ep2.jpg",
            season_number: 1,
          },
        ],
      };

      vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockSeason),
      } as Response);

      const result = await getSeasonDetails(1399, 1);

      expect(result.name).toBe("Season 1");
      expect(result.episodes).toHaveLength(2);
      expect(result.episodes[0].name).toBe("Pilot");
      expect(result.episodes[1].episode_number).toBe(2);

      const fetchCall = vi.mocked(globalThis.fetch).mock.calls[0][0] as string;
      expect(fetchCall).toContain("/tv/1399/season/1");
    });
  });

  describe("API key handling", () => {
    it("throws when TMDB_API_KEY is not set", async () => {
      vi.stubEnv("TMDB_API_KEY", "");

      await expect(searchShows("test")).rejects.toThrow(
        "TMDB_API_KEY is not set"
      );
    });
  });
});
