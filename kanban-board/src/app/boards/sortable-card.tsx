'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import Link from 'next/link'

type Board = {
  id: string
  name: string
  position: number
}

export default function SortableBoardCard({ board }: { board: Board }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: board.id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white rounded-lg shadow p-4 flex items-center gap-4"
    >
      {/* DRAG HANDLE — ONLY THIS PART IS DRAGGABLE */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-xl px-2 text-gray-500"
      >
        ⋮⋮
      </button>

      {/* Clickable link */}
      <Link href={`/boards/${board.id}`} className="flex-1">
        <h2 className="text-lg font-semibold text-black truncate">
          {board.name}
        </h2>
      </Link>
    </div>
  )
}
