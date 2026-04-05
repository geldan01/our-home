import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

        {/* Widget Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">

          {/* ── Shared Todos ── Warm notepad style */}
          <Link
            href="/dashboard/todos"
            className="group relative overflow-hidden rounded-2xl border border-amber-200/80 bg-linear-to-br from-amber-50 to-orange-50 p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg dark:border-amber-900/40 dark:from-amber-950/40 dark:to-orange-950/30"
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

          {/* ── TV Shows ── Cozy cinema/living room style */}
          <div className="relative overflow-hidden rounded-2xl border border-violet-200/80 bg-linear-to-br from-violet-50 to-indigo-50 p-6 shadow-sm dark:border-violet-900/40 dark:from-violet-950/40 dark:to-indigo-950/30">
            <div className="absolute bottom-0 left-0 h-20 w-20 -translate-x-6 translate-y-6 rounded-full bg-violet-200/30 dark:bg-violet-800/20" />
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/15 text-2xl ring-1 ring-violet-500/20 dark:bg-violet-400/10 dark:ring-violet-400/20">
                <span role="img" aria-label="TV">&#128250;</span>
              </div>
              <div>
                <h2 className="font-semibold text-violet-900 dark:text-violet-100">
                  TV Shows
                </h2>
                <p className="text-xs text-violet-700/60 dark:text-violet-300/50">
                  Track what you&apos;re watching
                </p>
              </div>
            </div>
            <div className="mt-5 flex flex-col items-center justify-center rounded-xl border border-dashed border-violet-300/60 py-8 dark:border-violet-700/40">
              <p className="text-sm font-medium text-violet-400 dark:text-violet-500">Coming soon</p>
              <p className="mt-1 text-xs text-violet-300 dark:text-violet-600">
                Status, progress &amp; ratings
              </p>
            </div>
          </div>

          {/* ── Meal Planner ── Warm kitchen/terracotta style */}
          <div className="relative overflow-hidden rounded-2xl border border-orange-200/80 bg-linear-to-br from-orange-50 to-rose-50 p-6 shadow-sm dark:border-orange-900/40 dark:from-orange-950/40 dark:to-rose-950/30">
            <div className="absolute top-0 left-0 h-14 w-14 -translate-x-4 -translate-y-4 rounded-full bg-orange-200/40 dark:bg-orange-800/20" />
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500/15 text-2xl ring-1 ring-orange-500/20 dark:bg-orange-400/10 dark:ring-orange-400/20">
                <span role="img" aria-label="Meals">&#127858;</span>
              </div>
              <div>
                <h2 className="font-semibold text-orange-900 dark:text-orange-100">
                  Meal Planner
                </h2>
                <p className="text-xs text-orange-700/60 dark:text-orange-300/50">
                  Recipes &amp; weekly meals
                </p>
              </div>
            </div>
            <div className="mt-5 flex flex-col items-center justify-center rounded-xl border border-dashed border-orange-300/60 py-8 dark:border-orange-700/40">
              <p className="text-sm font-medium text-orange-400 dark:text-orange-500">Coming soon</p>
              <p className="mt-1 text-xs text-orange-300 dark:text-orange-600">
                Save recipes &amp; plan meals
              </p>
            </div>
          </div>

          {/* ── Weather ── Fresh sky/breeze style */}
          <div className="relative overflow-hidden rounded-2xl border border-sky-200/80 bg-linear-to-br from-sky-50 to-cyan-50 p-6 shadow-sm dark:border-sky-900/40 dark:from-sky-950/40 dark:to-cyan-950/30">
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
                  Local forecast
                </p>
              </div>
            </div>
            <div className="mt-5 flex flex-col items-center justify-center rounded-xl border border-dashed border-sky-300/60 py-8 dark:border-sky-700/40">
              <p className="text-sm font-medium text-sky-400 dark:text-sky-500">Coming soon</p>
              <p className="mt-1 text-xs text-sky-300 dark:text-sky-600">
                Home &amp; saved cities
              </p>
            </div>
          </div>

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
      </div>
    </div>
  );
}
