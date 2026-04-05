"use client";

import { useState, useTransition } from "react";
import { rateShow } from "@/lib/tv-actions";

interface ShowStarRatingProps {
  showId: string;
  currentRating: number | null;
}

export default function ShowStarRating({ showId, currentRating }: ShowStarRatingProps) {
  const [hovered, setHovered] = useState(0);
  const [isPending, startTransition] = useTransition();

  function handleRate(rating: number) {
    startTransition(async () => {
      await rateShow(showId, rating);
    });
  }

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={isPending}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => handleRate(star)}
          className="text-2xl transition-colors disabled:opacity-50"
          aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
        >
          <span
            className={
              star <= (hovered || currentRating || 0)
                ? "text-amber-400"
                : "text-stone-300 dark:text-stone-600"
            }
          >
            &#9733;
          </span>
        </button>
      ))}
      {currentRating && (
        <span className="ml-2 text-sm text-stone-400">Your rating</span>
      )}
    </div>
  );
}
