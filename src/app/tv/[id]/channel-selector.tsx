"use client";

import { useTransition } from "react";
import { updateShowChannel } from "@/lib/tv-actions";

interface ChannelSelectorProps {
  showId: string;
  currentChannelId: string | null;
  channels: { id: string; name: string }[];
}

export default function ChannelSelector({ showId, currentChannelId, channels }: ChannelSelectorProps) {
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value || null;
    startTransition(async () => {
      await updateShowChannel(showId, value);
    });
  }

  return (
    <select
      value={currentChannelId ?? ""}
      onChange={handleChange}
      disabled={isPending}
      className="rounded-lg border border-violet-200 bg-white px-3 py-2 text-sm text-stone-900 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-none disabled:opacity-50 dark:border-violet-800 dark:bg-stone-900 dark:text-stone-100"
    >
      <option value="">No channel</option>
      {channels.map((ch) => (
        <option key={ch.id} value={ch.id}>
          {ch.name}
        </option>
      ))}
    </select>
  );
}
