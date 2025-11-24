'use client'

import { useState, FormEvent } from 'react'
import {
  useSignInEmailPassword,
  useAuthenticationStatus,
  useSignOut,
} from '@nhost/react'

export default function LoginPage() {
  const { isAuthenticated } = useAuthenticationStatus()
  const { signOut } = useSignOut()
  const { signInEmailPassword, isLoading, isError, error } =
    useSignInEmailPassword()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    await signInEmailPassword(email, password)
  }

  if (isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-pink-300">
        <div className="flex flex-col items-center gap-4 text-center bg-white/40 backdrop-blur-sm px-10 py-8 rounded-xl">
          <p className="text-lg text-black">You are signed in.</p>
          <button
            type="button"
            onClick={() => signOut()}
            className="bg-black text-pink-300 px-4 py-2 rounded-full font-semibold hover:bg-zinc-800"
          >
            Sign out
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-pink-300">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 w-full max-w-xs bg-white/40 backdrop-blur-sm px-8 py-8 rounded-xl text-black"
      >
        <h1 className="text-2xl font-bold text-center mb-2">Login</h1>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="border border-black/20 bg-white px-3 py-2 rounded placeholder-gray-600"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="border border-black/20 bg-white px-3 py-2 rounded placeholder-gray-600"
        />

        <button
          type="submit"
          disabled={isLoading}
          className="bg-black text-pink-300 px-3 py-2 rounded-full font-semibold hover:bg-zinc-800"
        >
          {isLoading ? 'Signing in…' : 'Sign in'}
        </button>

        {isError && (
          <p className="text-red-500 text-sm text-center mt-2">
            {error?.message ?? 'Sign in failed'}
          </p>
        )}
      </form>
    </div>
  )
}
