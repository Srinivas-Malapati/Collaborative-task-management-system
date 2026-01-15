import Link from "next/link";
import { notFound } from "next/navigation";
import { PROJECTS } from "@/lib/data";
import TaskBoard from "./TaskBoard";

export default async function ProjectPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const project = PROJECTS.find((p) => p.id === params.id);
  if (!project) return notFound();

  return (
    <main className="min-h-screen w-full bg-zinc-950 text-zinc-100 font-sans selection:bg-blue-500/30">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <nav className="flex items-center gap-2 mb-1 text-sm text-zinc-400">
                <Link href="/projects" className="hover:text-white transition-colors">Projects</Link>
                <span className="text-zinc-600">/</span>
                <span className="font-mono text-xs bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">{project.id}</span>
              </nav>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-white">{project.name}</h1>
                <span className="px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-blue-400 bg-blue-400/10 border border-blue-400/20 rounded-full">
                  Beta
                </span>
              </div>
            </div>


          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <TaskBoard project={project} />
      </div>
    </main>
  );
}
