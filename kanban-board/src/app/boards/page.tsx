// app/boards/page.tsx
'use client'

import { gql, useQuery, useMutation } from '@apollo/client'
import { useEffect, useRef, useState } from 'react'
import { useAuthenticationStatus, useUserId } from '@nhost/react'

import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragStartEvent,
  DragEndEvent
} from '@dnd-kit/core'

import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable
} from '@dnd-kit/sortable'

import { CSS } from '@dnd-kit/utilities'

type Board = {
  id: string
  name: string
  position: number
}

/* ============================
   GraphQL
============================ */

const BOARDS = gql`
  query Boards {
    boards(order_by: { position: asc }) {
      id
      name
      position
    }
  }
`

const CREATE_BOARD = gql`
  mutation CreateBoard($name: String!, $owner: uuid!, $position: numeric!) {
    insert_boards_one(
      object: { name: $name, owner: $owner, position: $position }
    ) {
      id
    }
  }
`

const UPDATE_BOARD_POSITIONS = gql`
  mutation UpdateBoardPositions($updates: [boards_updates!]!) {
    update_boards_many(updates: $updates) {
      affected_rows
    }
  }
`

const RENAME_BOARD = gql`
  mutation RenameBoard($id: uuid!, $name: String!) {
    update_boards_by_pk(pk_columns: { id: $id }, _set: { name: $name }) {
      id
      name
    }
  }
`

const DELETE_BOARD = gql`
  mutation DeleteBoard($id: uuid!) {
    delete_boards(where: { id: { _eq: $id } }) {
      affected_rows
    }
  }
`

/* ============================
   Helpers
============================ */

function useClickOutside<T extends HTMLElement>(onOutside: () => void) {
  const ref = useRef<T | null>(null)
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (!ref.current) return
      if (!ref.current.contains(e.target as Node)) onOutside()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onOutside])
  return ref
}

/* ============================
   Draggable board row + preview
============================ */

function DraggableBoardRow({
  board,
  onRename,
  onDelete
}: {
  board: Board
  onRename: (id: string, name: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const {
    setNodeRef,
    setActivatorNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging
  } = useSortable({ id: board.id, data: { type: 'board' } })

  const [menuOpen, setMenuOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(board.name)
  const menuRef = useClickOutside<HTMLDivElement>(() => setMenuOpen(false))

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative rounded-2xl border border-pink-400 bg-white text-black shadow p-4 flex items-center justify-between ${isDragging ? 'opacity-0' : 'opacity-100'}`}
    >
      <div className="flex items-center gap-3">
        <button
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-pink-700"
          aria-label="Drag board"
          onClick={e => e.stopPropagation()}
        >
          ⣿
        </button>

        {editing ? (
          <input
            autoFocus
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={async e => {
              if (e.key === 'Enter') {
                const n = value.trim()
                if (n && n !== board.name) await onRename(board.id, n)
                setEditing(false)
              }
              if (e.key === 'Escape') {
                setValue(board.name)
                setEditing(false)
              }
            }}
            onBlur={async () => {
              const n = value.trim()
              if (n && n !== board.name) await onRename(board.id, n)
              else setValue(board.name)
              setEditing(false)
            }}
            className="px-2 py-1 border border-gray-300 rounded"
          />
        ) : (
          <a
            href={`/boards/${board.id}`}
            className="font-semibold hover:underline"
          >
            {board.name}
          </a>
        )}
      </div>

      <div className="relative">
        <button
          className="h-8 w-8 grid place-items-center rounded hover:bg-gray-100"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-label="Board menu"
          onClick={e => {
            e.stopPropagation()
            setMenuOpen(v => !v)
          }}
        >
          ⋯
        </button>

        {menuOpen && (
          <div
            ref={menuRef}
            role="menu"
            className="absolute right-0 mt-1 w-40 rounded-md border border-gray-200 bg-white shadow-lg z-10"
            onClick={e => e.stopPropagation()}
          >
            <button
              role="menuitem"
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
              onClick={() => {
                setMenuOpen(false)
                setEditing(true)
              }}
            >
              Rename board
            </button>
            <button
              role="menuitem"
              className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
              onClick={async () => {
                setMenuOpen(false)
                await onDelete(board.id)
              }}
            >
              Delete board
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// Lightweight, non-sortable preview for DragOverlay
function BoardRowPreview({ board }: { board: Board }) {
  return (
    <div className="rounded-2xl border border-pink-400 bg-white text-black shadow-lg p-4 flex items-center justify-between opacity-90">
      <div className="flex items-center gap-3">
        <span className="text-pink-700 select-none">⣿</span>
        <span className="font-semibold">{board.name}</span>
      </div>
      <span className="h-8 w-8" />
    </div>
  )
}

/* ============================
   Page
============================ */

export default function BoardsPage() {
  const { isAuthenticated } = useAuthenticationStatus()
  const userId = useUserId()

  const { data, loading, error, refetch } = useQuery<{ boards: Board[] }>(
    BOARDS,
    { skip: !isAuthenticated }
  )

  const [name, setName] = useState('')
  const [activeId, setActiveId] = useState<string | null>(null)

  const [createBoard] = useMutation(CREATE_BOARD)
  const [updateBoardPositions] = useMutation(UPDATE_BOARD_POSITIONS)
  const [renameBoard] = useMutation(RENAME_BOARD)
  const [deleteBoard] = useMutation(DELETE_BOARD)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } })
  )

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-pink-300 flex items-center justify-center">
        <p className="text-2xl font-bold">Please sign in</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-pink-300 flex items-center justify-center">
        <p className="text-2xl font-bold">Loading boards…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-pink-300 flex items-center justify-center">
        <p className="text-2xl font-bold">Error: {error.message}</p>
      </div>
    )
  }

  const boards = data?.boards ?? []
  const activeBoard = activeId ? boards.find(b => b.id === activeId) ?? null : null

  async function handleCreate() {
    const n = name.trim()
    if (!n || !userId) return
    await createBoard({
      variables: {
        name: n,
        owner: userId,
        position: boards.length
      }
    })
    setName('')
    refetch()
  }

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id))
  }

  async function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e
    setActiveId(null)
    if (!over || active.id === over.id) return

    const oldIndex = boards.findIndex(b => b.id === active.id)
    const newIndex = boards.findIndex(b => b.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(boards, oldIndex, newIndex)
    const updates = reordered.map((b, index) => ({
      where: { id: { _eq: b.id } },
      _set: { position: index }
    }))

    await updateBoardPositions({ variables: { updates } })
    refetch()
  }

  async function handleRename(id: string, newName: string) {
    try {
      await renameBoard({ variables: { id, name: newName } })
      refetch()
    } catch {
      await refetch()
    }
  }

  async function handleDelete(id: string) {
    await deleteBoard({ variables: { id } })
    const remaining = boards.filter(b => b.id !== id)
    const updates = remaining.map((b, i) => ({
      where: { id: { _eq: b.id } },
      _set: { position: i }
    }))
    if (updates.length) await updateBoardPositions({ variables: { updates } })
    refetch()
  }

  return (
    <div className="min-h-screen bg-pink-300 p-8">
      <h1 className="text-4xl font-bold text-black mb-8 text-center">
        Your Boards
      </h1>

      <div className="flex gap-4 mb-8 justify-center">
        <input
          className="px-4 py-2 rounded border border-gray-300"
          placeholder="New board name"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={async e => {
            if (e.key === 'Enter') await handleCreate()
          }}
        />
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-black text-pink-300 rounded hover:bg-zinc-800"
        >
          Create
        </button>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={boards.map(b => b.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-4 max-w-xl mx-auto">
            {boards.map(b => (
              <DraggableBoardRow
                key={b.id}
                board={b}
                onRename={handleRename}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeBoard ? <BoardRowPreview board={activeBoard} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
