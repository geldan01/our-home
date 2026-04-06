import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchWeather } from "@/lib/weather";
import MealPlanWidget from "./meal-plan-widget";
import TvWidget from "./tv-widget";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const user = session.user;

  const todoLists = await prisma.todoList.findMany({
    where: {
      OR: [
        { preferences: { none: { userId: user.id } } },
        { preferences: { some: { userId: user.id, showOnDashboard: true } } },
      ],
    },
    include: {
      items: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const totalTodos = todoLists.reduce((sum, list) => sum + list.items.length, 0);
  const completedTodos = todoLists.reduce(
    (sum, list) => sum + list.items.filter((item) => item.done).length,
    0
  );

  const primaryCity = await prisma.weatherCity.findFirst({
    where: { isPrimary: true },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayDate = today.toISOString().split("T")[0];

  const todayMealEntries = await prisma.mealPlanEntry.findMany({
    where: { date: today },
    include: { meal: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });

  const upNextEpisodes = await prisma.tvEpisode.findMany({
    where: {
      airDate: { lte: today },
      season: {
        show: {
          status: "WATCHING",
          OR: [
            { watchMode: "HOUSEHOLD" },
            { ownerId: user.id },
          ],
        },
      },
      watchedBy: { none: { userId: user.id } },
    },
    orderBy: { airDate: "desc" },
    take: 10,
    distinct: ["seasonId"],
    include: {
      season: {
        select: {
          seasonNumber: true,
          show: { select: { id: true, name: true, posterPath: true } },
        },
      },
    },
  });

  // Deduplicate by show — keep only the first unwatched episode per show
  const seenShows = new Set<string>();
  const dedupedEpisodes = upNextEpisodes
    .filter((ep) => {
      if (seenShows.has(ep.season.show.id)) return false;
      seenShows.add(ep.season.show.id);
      return true;
    })
    .sort((a, b) =>
      a.season.show.name.localeCompare(b.season.show.name),
    );

  let weatherData = null;
  if (primaryCity) {
    try {
      weatherData = await fetchWeather(
        primaryCity.latitude,
        primaryCity.longitude,
        primaryCity.timezone,
      );
    } catch {
      // Weather API unavailable — show fallback
    }
  }

  return (
    <div className="flex min-h-full flex-1 items-start justify-center px-4 py-10 sm:px-6">
      <div className="w-full max-w-5xl space-y-8">
        {/* Welcome */}
        <div className="border-b border-amber-200/60 pb-6 dark:border-amber-900/30">
          <p className="text-sm font-medium tracking-wide text-amber-700/70 uppercase dark:text-amber-400/60">
            Welcome back
          </p>
          <p className="mt-2 text-base text-stone-600 dark:text-stone-400">
            Good to see you, {user.name ?? user.email}
          </p>
        </div>

        {/* Widget Grid — Main body (2/3) + Right sidebar (1/3) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* ── Main Column (2/3 width) ── */}
          <div className="space-y-6 lg:col-span-2">

            {/* ── Shared Todos ── Warm notepad style */}
            <Link
              href="/dashboard/todos"
              className="group relative block overflow-hidden rounded-2xl border border-amber-200/80 bg-linear-to-br from-amber-50 to-orange-50 p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg dark:border-amber-900/40 dark:from-amber-950/40 dark:to-orange-950/30"
            >
              <div className="absolute top-0 right-0 h-16 w-16 translate-x-4 -translate-y-4 rounded-full bg-amber-200/30 dark:bg-amber-800/20" />
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/15 text-2xl ring-1 ring-amber-500/20 dark:bg-amber-400/10 dark:ring-amber-400/20">
                  <span role="img" aria-label="Todos">&#9745;</span>
                </div>
                <div>
                  <h2 className="font-semibold text-amber-900 dark:text-amber-100">
                    Shared Todos
                  </h2>
                  <p className="text-xs text-amber-700/60 dark:text-amber-300/50">
                    {todoLists.length} {todoLists.length === 1 ? "list" : "lists"} &middot;{" "}
                    {completedTodos}/{totalTodos} done
                  </p>
                </div>
              </div>
              {todoLists.length > 0 ? (
                <ul className="mt-5 space-y-2.5">
                  {todoLists.slice(0, 3).map((list) => {
                    const done = list.items.filter((i) => i.done).length;
                    const total = list.items.length;
                    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                    return (
                      <li key={list.id} className="text-sm">
                        <div className="flex items-center justify-between text-amber-800 dark:text-amber-200">
                          <span className="truncate">{list.name}</span>
                          <span className="ml-2 shrink-0 text-xs text-amber-600/50 dark:text-amber-400/40">
                            {done}/{total}
                          </span>
                        </div>
                        <div className="mt-1.5 h-1.5 w-full rounded-full bg-amber-200/60 dark:bg-amber-800/40">
                          <div
                            className="h-1.5 rounded-full bg-amber-500 transition-all dark:bg-amber-400"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="mt-5 text-sm text-amber-600/50 dark:text-amber-400/40">
                  No lists yet. Tap to create one.
                </p>
              )}
              <p className="mt-5 text-xs font-medium text-amber-600/50 transition-colors group-hover:text-amber-700 dark:text-amber-400/40 dark:group-hover:text-amber-300">
                View all &rarr;
              </p>
            </Link>

            {/* ── TV Shows ── Up Next widget */}
            <TvWidget episodes={dedupedEpisodes} />

            {/* ── Household Projects ── Earthy workshop style */}
            <div className="relative overflow-hidden rounded-2xl border border-emerald-200/80 bg-linear-to-br from-emerald-50 to-teal-50 p-6 shadow-sm dark:border-emerald-900/40 dark:from-emerald-950/40 dark:to-teal-950/30">
              <div className="absolute bottom-0 right-0 h-16 w-16 translate-x-4 translate-y-4 rounded-full bg-emerald-200/30 dark:bg-emerald-800/20" />
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/15 text-2xl ring-1 ring-emerald-500/20 dark:bg-emerald-400/10 dark:ring-emerald-400/20">
                  <span role="img" aria-label="Projects">&#128736;</span>
                </div>
                <div>
                  <h2 className="font-semibold text-emerald-900 dark:text-emerald-100">
                    Projects
                  </h2>
                  <p className="text-xs text-emerald-700/60 dark:text-emerald-300/50">
                    Home improvement &amp; more
                  </p>
                </div>
              </div>
              <div className="mt-5 flex flex-col items-center justify-center rounded-xl border border-dashed border-emerald-300/60 py-8 dark:border-emerald-700/40">
                <p className="text-sm font-medium text-emerald-400 dark:text-emerald-500">Coming soon</p>
                <p className="mt-1 text-xs text-emerald-300 dark:text-emerald-600">
                  Track status &amp; notes
                </p>
              </div>
            </div>

          </div>

          {/* ── Right Sidebar (1/3 width) ── */}
          <div className="space-y-6">

            {/* ── Weather ── Fresh sky/breeze style */}
            <Link
              href="/weather"
              className="group relative block overflow-hidden rounded-2xl border border-sky-200/80 bg-linear-to-br from-sky-50 to-cyan-50 p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg dark:border-sky-900/40 dark:from-sky-950/40 dark:to-cyan-950/30"
            >
              <div className="absolute top-0 right-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-sky-200/30 dark:bg-sky-800/20" />
              <div className="absolute bottom-0 right-8 h-10 w-10 translate-y-3 rounded-full bg-cyan-200/20 dark:bg-cyan-800/10" />
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-500/15 text-2xl ring-1 ring-sky-500/20 dark:bg-sky-400/10 dark:ring-sky-400/20">
                  <span role="img" aria-label="Weather">&#9925;</span>
                </div>
                <div>
                  <h2 className="font-semibold text-sky-900 dark:text-sky-100">
                    Weather
                  </h2>
                  <p className="text-xs text-sky-700/60 dark:text-sky-300/50">
                    {primaryCity ? primaryCity.name : "Local forecast"}
                  </p>
                </div>
              </div>

              {primaryCity && weatherData ? (
                <div className="mt-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-light text-sky-900 dark:text-sky-100">
                        {weatherData.current.temperature}°
                      </span>
                      <span className="text-3xl">
                        {weatherData.current.icon}
                      </span>
                    </div>
                    {weatherData.daily[0] && (
                      <div className="text-right text-xs text-sky-600 dark:text-sky-400">
                        <p>H: {weatherData.daily[0].temperatureMax}°</p>
                        <p>L: {weatherData.daily[0].temperatureMin}°</p>
                      </div>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-sky-700/80 dark:text-sky-300/60">
                    {weatherData.current.description}
                  </p>
                  <p className="mt-0.5 text-xs text-sky-600/60 dark:text-sky-400/50">
                    Feels like {weatherData.current.apparentTemperature}° &middot; Wind {weatherData.current.windSpeed} km/h
                  </p>
                </div>
              ) : (
                <div className="mt-5 flex flex-col items-center justify-center rounded-xl border border-dashed border-sky-300/60 py-8 dark:border-sky-700/40">
                  <p className="text-sm font-medium text-sky-400 dark:text-sky-500">
                    {primaryCity ? "Unable to load weather" : "No cities configured"}
                  </p>
                  <p className="mt-1 text-xs text-sky-300 dark:text-sky-600">
                    {primaryCity ? "Tap to retry" : "Add cities in Admin"}
                  </p>
                </div>
              )}
            </Link>

            {/* ── Meal Planner ── Chalkboard style */}
            <MealPlanWidget
              todayEntries={todayMealEntries.map((e) => ({
                id: e.id,
                meal: { id: e.meal.id, name: e.meal.name },
              }))}
              todayDate={todayDate}
            />

          </div>

        </div>
      </div>
    </div>
  );
}
