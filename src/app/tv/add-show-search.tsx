"use client";

import { useState, useRef, useEffect } from "react";
import { addShowFromTmdb, searchTmdbShows } from "@/lib/tv-actions";

interface SearchResult {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  first_air_date: string;
  vote_average: number;
}

export default function AddShowSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleChange(value: string) {
    setQuery(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!value.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    timerRef.current = setTimeout(async () => {
      try {
        const res = await searchTmdbShows(value);
        setResults(res);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 400);
  }

  async function handleAdd(tmdbId: number) {
    setAdding(tmdbId);
    try {
      await addShowFromTmdb(tmdbId);
      setQuery("");
      setResults([]);
      setOpen(false);
    } finally {
      setAdding(null);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Search TMDB to add a show..."
        className="w-full rounded-lg border border-violet-200 bg-white px-4 py-2.5 text-sm text-stone-900 placeholder-stone-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-none dark:border-violet-800 dark:bg-stone-900 dark:text-stone-100 dark:placeholder-stone-500"
      />
      {loading && (
        <div className="absolute top-3 right-3 text-xs text-violet-400">
          Searching...
        </div>
      )}
      {open && results.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-80 w-full overflow-y-auto rounded-lg border border-violet-200 bg-white shadow-lg dark:border-violet-800 dark:bg-stone-900">
          {results.map((show) => (
            <li key={show.id}>
              <button
                type="button"
                disabled={adding === show.id}
                onClick={() => handleAdd(show.id)}
                className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-violet-50 disabled:opacity-50 dark:hover:bg-violet-900/30"
              >
                {show.poster_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w92${show.poster_path}`}
                    alt=""
                    className="h-16 w-11 shrink-0 rounded object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-11 shrink-0 items-center justify-center rounded bg-violet-100 text-xs text-violet-400 dark:bg-violet-900/40">
                    TV
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-stone-900 dark:text-stone-100">
                    {show.name}
                  </p>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    {show.first_air_date?.slice(0, 4) ?? "Unknown"}{" "}
                    &middot; TMDB {show.vote_average.toFixed(1)}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-stone-400 dark:text-stone-500">
                    {show.overview}
                  </p>
                </div>
                {adding === show.id && (
                  <span className="ml-auto shrink-0 text-xs text-violet-500">
                    Adding...
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
