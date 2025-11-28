// app/boards/[id]/cardlist.tsx
'use client'

import {
  useSortable,
  verticalListSortingStrategy,
  SortableContext
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useEffect, useRef, useState } from 'react'

export type ColumnType = {
  id: string
  name: string
  position: number
}

export type Card = {
  id: string
  title: string
  position: number
  column_id: string
}

type CardListProps = {
  columnId: string
  cards: Card[]
  onRenameCard: (id: string, title: string) => Promise<void>
  onDeleteCard: (card: Card) => Promise<void>
}

type SortableCardProps = {
  card: Card
  onRename: (id: string, title: string) => Promise<void>
  onDelete: (card: Card) => Promise<void>
}

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

function SortableCard({ card, onRename, onDelete }: SortableCardProps) {
  const {
    setNodeRef,
    setActivatorNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging
  } = useSortable({ id: card.id, data: { type: 'card' } })

  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(card.title)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useClickOutside<HTMLDivElement>(() => setMenuOpen(false))

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative bg-white border border-pink-300 rounded-xl p-3 shadow-sm text-sm"
    >
      <div className="flex items-start gap-2">
        <button
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing leading-none pt-1"
          title="Drag card"
          aria-label="Drag card"
          onClick={e => e.stopPropagation()}
        >
          ⣿
        </button>

        <div className="flex-1">
          {editing ? (
            <input
              autoFocus
              value={value}
              onChange={e => setValue(e.target.value)}
              onKeyDown={async e => {
                if (e.key === 'Enter') {
                  const t = value.trim()
                  if (t && t !== card.title) await onRename(card.id, t)
                  setEditing(false)
                }
                if (e.key === 'Escape') {
                  setValue(card.title)
                  setEditing(false)
                }
              }}
              onBlur={async () => {
                const t = value.trim()
                if (t && t !== card.title) await onRename(card.id, t)
                else setValue(card.title)
                setEditing(false)
              }}
              className="w-full p-1 border border-gray-300 rounded text-sm"
            />
          ) : (
            <p className="font-medium break-words">{card.title}</p>
          )}
        </div>

        <div className="relative">
          <button
            className="h-6 w-6 grid place-items-center rounded hover:bg-gray-100"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="Card menu"
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
              className="absolute right-0 mt-1 w-32 rounded-md border border-gray-200 bg-white shadow-lg z-10"
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
                Rename
              </button>
              <button
                role="menuitem"
                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                onClick={async () => {
                  setMenuOpen(false)
                  await onDelete(card)
                }}
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function CardList({
  columnId,
  cards,
  onRenameCard,
  onDeleteCard
}: CardListProps) {
  const sorted = [...cards].sort(
    (a, b) => Number(a.position) - Number(b.position)
  )
  const needsScroll = sorted.length > 5

  return (
    <SortableContext
      items={sorted.map(card => card.id)}
      strategy={verticalListSortingStrategy}
    >
      <div
        className={`flex flex-col gap-2 pr-1 ${
          needsScroll ? 'max-h-[420px] overflow-y-auto' : 'overflow-visible'
        }`}
      >
        {sorted.map(card => (
          <SortableCard
            key={card.id}
            card={card}
            onRename={onRenameCard}
            onDelete={onDeleteCard}
          />
        ))}
      </div>
    </SortableContext>
  )
}
