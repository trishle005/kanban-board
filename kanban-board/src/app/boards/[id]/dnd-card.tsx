'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Card } from './cardlist'

export default function SortableCard({ card }: { card: Card }) {
  const { setNodeRef, attributes, listeners, transform, transition } =
    useSortable({ id: card.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white text-black p-3 rounded border border-gray-300 shadow cursor-grab active:cursor-grabbing"
    >
      {card.title}
    </div>
  )
}