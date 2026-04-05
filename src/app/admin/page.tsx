import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { promoteToAdmin, demoteToMember } from "@/lib/auth-actions";
import { prisma } from "@/lib/prisma";
import { Role } from "@/generated/prisma";

function PromoteButton({ userId }: { userId: string }) {
  const promoteAction = promoteToAdmin.bind(null, userId);

  return (
    <form action={promoteAction}>
      <button
        type="submit"
        className="rounded-md bg-amber-600 px-2.5 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
      >
        Promote to Admin
      </button>
    </form>
  );
}

function DemoteButton({ userId }: { userId: string }) {
  const demoteAction = demoteToMember.bind(null, userId);

  return (
    <form action={demoteAction}>
      <button
        type="submit"
        className="rounded-md bg-red-600 px-2.5 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
      >
        Remove Admin
      </button>
    </form>
  );
}

export default async function AdminPage() {
  const session = await auth();

  if (!session || session.user.role !== Role.ADMIN) {
    redirect("/login");
  }

  const currentUser = session.user;
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  return (
    <div className="flex min-h-full flex-1 items-start justify-center px-4 py-12">
      <div className="w-full max-w-4xl space-y-6">
        <div className="rounded-lg bg-white p-6 shadow ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                Admin Panel
              </h1>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Signed in as {currentUser.name ?? currentUser.email} ({currentUser.role})
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white shadow ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
          <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Users
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {users.length} registered {users.length === 1 ? "user" : "users"}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-800/50">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/30"
                  >
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-900 dark:text-zinc-100">
                      {user.name ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                      {user.email}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          user.role === Role.ADMIN
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                            : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                      {new Date(user.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      {user.role === Role.MEMBER && (
                        <PromoteButton userId={user.id} />
                      )}
                      {user.role === Role.ADMIN && user.id !== currentUser.id && (
                        <DemoteButton userId={user.id} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
