'use client';

export default function AboutPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      <h1 className="text-3xl font-semibold mb-2">About this project</h1>
      <p className="text-base text-muted-foreground max-w-xl text-center">
        This is a kanban board built with Next.js, Nhost, Apollo, and drag and drop.
      </p>
    </main>
  );
}
