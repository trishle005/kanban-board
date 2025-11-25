'use client'

import { gql, useQuery, useMutation } from '@apollo/client'
import { useState } from 'react'
import Link from 'next/link'
import { useAuthenticationStatus, useUserId } from '@nhost/react'

// dnd-kit imports
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core'

import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove
} from '@dnd-kit/sortable'

import { SortableBoardCard } from './dnd-card'

type Board = {
  id: string
  name: string
  position: number
  owner: string
}

const BOARDS = gql`
  query Boards {
    boards(order_by: { position: asc }) {
      id
      name
      position
      owner
    }
  }
`

const CREATE_BOARD = gql`
  mutation CreateBoard($name: String!, $owner: uuid!, $position: numeric!) {
    insert_boards_one(object: {
      name: $name,
      owner: $owner,
      position: $position
    }) {
      id
      name
      position
      owner
    }
  }
`

const UPDATE_BOARD_POSITIONS = gql`
  mutation UpdateBoardPositions($updates: [boards_updates!]!) {
    update_boards_many(updates: $updates) {
      affected_rows
      returning {
        id
        position
      }
    }
  }
`



export default function BoardsPage() {
  // ALWAYS FIRST — Authentication hooks
  const { isAuthenticated } = useAuthenticationStatus()
  const userId = useUserId()

  // ALWAYS SECOND — GraphQL hooks
  const { data, loading, error } = useQuery<{ boards: Board[] }>(BOARDS, {
    skip: !isAuthenticated
  })

  // ALWAYS THIRD — Other hooks
  const [name, setName] = useState("")

  const [createBoard] = useMutation(CREATE_BOARD)
  const [updatePositions] = useMutation(UPDATE_BOARD_POSITIONS)

  // ALWAYS FOURTH — DND HOOKS (must NOT be inside conditional)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  // NOW SAFE TO USE CONDITIONAL RETURNS ------------------------------------
  if (!isAuthenticated) return <div>Please sign in</div>
  if (loading) return <div>Loading…</div>
  if (error) return <div>Error: {error.message}</div>

  const boards = data?.boards ?? []

  async function handleDragEnd(event: any) {
  const { active, over } = event
  if (!over || active.id === over.id) return

  const oldIndex = data!.boards.findIndex(b => b.id === active.id)
  const newIndex = data!.boards.findIndex(b => b.id === over.id)

  const reordered = arrayMove(data!.boards, oldIndex, newIndex)

  const updates = reordered.map((b, index) => ({
    where: { id: { _eq: b.id } },
    _set: { position: index }   // ✔ THIS IS CORRECT
  }))

  console.log("updates SENT to Hasura:", updates)

  await updatePositions({
    variables: { updates },
    refetchQueries: [{ query: BOARDS }]
  }).catch(err => console.error("Update error:", err))
}



  return (
    <div className="min-h-screen bg-pink-300 p-10">
      <h1 className="text-4xl font-bold text-black mb-8">Your Boards</h1>

      <div className="mb-8 flex gap-4">
        <input
          className="px-4 py-2 rounded border border-gray-300"
          placeholder="New board name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button
          className="px-4 py-2 bg-black text-pink-300 rounded hover:bg-zinc-800"
          onClick={async () => {
            if (!name.trim() || !userId) return

            await createBoard({
              variables: {
                name,
                owner: userId,
                position: boards.length
              }
            })

            setName("")
          }}
        >
          Create
        </button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={boards.map(b => b.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-4">
            {boards.map(b => (
              <SortableBoardCard key={b.id} id={b.id} name={b.name} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}
