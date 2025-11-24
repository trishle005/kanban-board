'use client'

import { gql, useQuery } from '@apollo/client'
import { useAuthenticationStatus } from '@nhost/react'

const BOARDS = gql`
  query {
    boards(order_by: { position: asc }) {
      id
      name
      position
    }
  }
`

export default function BoardsPage() {
  const { isAuthenticated } = useAuthenticationStatus()
  const { data, loading, error } = useQuery(BOARDS, { skip: !isAuthenticated })

  if (!isAuthenticated) return <p>Please sign in</p>
  if (loading) return <p>Loading…</p>
  if (error) return <p>Error: {error.message}</p>

  return (
    <ul>
      {data.boards.map((b: any) => (
        <li key={b.id}>{b.name}</li>
      ))}
    </ul>
  )
}
