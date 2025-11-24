export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-pink-300 font-sans">
      <main className="flex flex-col items-center justify-center text-center gap-10 px-6 py-20">
        
        {/* Title */}
        <h1 className="text-4xl font-bold text-black tracking-tight">
          Kanban Board
        </h1>

        {/* Subtitle */}
        <p className="text-lg text-black max-w-md leading-relaxed">
          Organize your projects and track your workflow with a simple and clean board system. Sign in to get started.
        </p>

        {/* CTA */}
        <a
          href="/login"
          className="flex h-12 w-48 items-center justify-center rounded-full bg-black text-pink-300 font-semibold transition hover:bg-zinc-800"
        >
          Sign In
        </a>
      </main>
    </div>
  );
}
