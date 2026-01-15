import Link from "next/link";
import { listProjects } from "@/lib/store";

export default function ProjectsPage() {
  const projects = listProjects();

  function count(tasks: any[], status: "todo" | "in_progress" | "done") {
    return tasks.filter((t) => t.status === status).length;
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Projects</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Choose a project to view tasks, progress, and details.
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {projects.map((p) => (
          <Link
            key={p.id}
            href={`/projects/${p.id}`}
            className="group rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 shadow-sm transition hover:border-zinc-700 hover:bg-zinc-900/60"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">{p.name}</h2>
                <p className="mt-1 text-sm text-zinc-400">{p.description}</p>
              </div>
              <span className="text-zinc-500 transition group-hover:text-zinc-300">
                →
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border border-zinc-800 bg-zinc-950/40 px-2 py-1 text-zinc-300">
                To do: {count(p.tasks, "todo")}
              </span>
              <span className="rounded-full border border-zinc-800 bg-zinc-950/40 px-2 py-1 text-zinc-300">
                In progress: {count(p.tasks, "in_progress")}
              </span>
              <span className="rounded-full border border-zinc-800 bg-zinc-950/40 px-2 py-1 text-zinc-300">
                Done: {count(p.tasks, "done")}
              </span>
              <span className="ml-auto rounded-full border border-zinc-800 bg-zinc-950/40 px-2 py-1 text-zinc-400">
                ID: {p.id}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
