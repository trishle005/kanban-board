'use client'

import { useAuthenticationStatus } from '@nhost/nextjs'
import Link from 'next/link'

export default function Home() {
  const { isAuthenticated, isLoading } = useAuthenticationStatus()

  // while Nhost checks session
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-pink-300 font-sans">
        <p className="text-black">Loading…</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-pink-300 font-sans">
      <main className="flex flex-col items-center justify-center text-center gap-10 px-6 py-20">

        <h1 className="text-4xl font-bold text-black tracking-tight">
          Kanban Board
        </h1>

        <p className="text-lg text-black max-w-md leading-relaxed">
          Organize your projects and track your workflow with a simple and clean board system.
        </p>

        <div className="flex gap-4">
          {/* SHOW WHEN AUTHENTICATED */}
          {isAuthenticated && (
            <Link
              href="/boards"
              className="flex h-12 w-48 items-center justify-center rounded-full 
              bg-black text-pink-300 font-semibold transition hover:bg-zinc-800"
            >
              View Boards
            </Link>
          )}

          {/* SHOW WHEN NOT AUTHENTICATED */}
          {!isAuthenticated && (
            <Link
              href="/login"
              className="flex h-12 w-48 items-center justify-center rounded-full 
              bg-black text-pink-300 font-semibold transition hover:bg-zinc-800"
            >
              Sign In
            </Link>
          )}
        </div>

      </main>
    </div>
  )
}
