'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import Link from 'next/link'

export function SortableBoardCard({ id, name }: { id: string; name: string }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id })

  const style: any = {
    transform: CSS.Transform.toString(transform),
    transition
  }

  // Prevent Link navigation if the user is dragging
  function handleClick(e: any) {
    if (isDragging) {
      e.preventDefault()
      e.stopPropagation()
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="p-6 bg-white rounded-lg shadow border"
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing mb-2"
      >
        :::
      </div>

      {/* Clickable part */}
      <Link href={`/boards/${id}`} onClick={handleClick}>
        <h2 className="text-xl font-semibold text-black hover:underline">
          {name}
        </h2>
      </Link>
    </div>
  )
}
