// app/boards/[id]/dnd-column.tsx
'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useEffect, useRef, useState } from 'react'

import CardList, { ColumnType, Card } from './cardlist'

type Props = {
  column: ColumnType
  cards: Card[]
  onAddCard: (columnId: string, title: string) => Promise<void>
  onRenameCard: (cardId: string, newTitle: string) => Promise<void>
  onDeleteCard: (card: Card) => Promise<void>
  onRenameColumn: (columnId: string, name: string) => Promise<void>
  onDeleteColumn: (column: ColumnType) => Promise<void>
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

export default function SortableColumn({
  column,
  cards,
  onAddCard,
  onRenameCard,
  onDeleteCard,
  onRenameColumn,
  onDeleteColumn
}: Props) {
  const { setNodeRef, attributes, listeners, transform, transition } =
    useSortable({ id: column.id, data: { type: 'column' } })

  const [title, setTitle] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [colName, setColName] = useState(column.name)
  const menuRef = useClickOutside<HTMLDivElement>(() => setMenuOpen(false))

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  }

  async function handleAddCard() {
    const t = title.trim()
    if (!t) return
    await onAddCard(column.id, t)
    setTitle('')
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="w-64 bg-pink-200 p-4 rounded-2xl border border-pink-400 shadow flex-shrink-0 min-h-0"
    >
      <div className="flex items-center justify-between mb-3">
        <div
          className="flex items-center gap-2 cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <span className="h-6 flex items-center gap-0.5">
            <span className="w-1 h-5 bg-pink-500 rounded-full" />
            <span className="w-1 h-5 bg-pink-500 rounded-full" />
            <span className="w-1 h-5 bg-pink-500 rounded-full" />
          </span>

          {renaming ? (
            <input
              autoFocus
              value={colName}
              onChange={e => setColName(e.target.value)}
              onKeyDown={async e => {
                if (e.key === 'Enter') {
                  const n = colName.trim()
                  if (n && n !== column.name) await onRenameColumn(column.id, n)
                  setRenaming(false)
                }
                if (e.key === 'Escape') {
                  setColName(column.name)
                  setRenaming(false)
                }
              }}
              onBlur={async () => {
                const n = colName.trim()
                if (n && n !== column.name) await onRenameColumn(column.id, n)
                else setColName(column.name)
                setRenaming(false)
              }}
              className="p-1 rounded border border-gray-300 bg-white text-sm"
            />
          ) : (
            <span className="font-semibold truncate">{column.name}</span>
          )}
        </div>

        <div className="relative">
          <button
            className="h-6 w-6 grid place-items-center rounded hover:bg-pink-100"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="Column menu"
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
              className="absolute right-0 mt-1 w-36 rounded-md border border-gray-200 bg-white shadow-lg z-10"
              onClick={e => e.stopPropagation()}
            >
              <button
                role="menuitem"
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                onClick={() => {
                  setMenuOpen(false)
                  setRenaming(true)
                  setColName(column.name)
                }}
              >
                Rename column
              </button>
              <button
                role="menuitem"
                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                onClick={async () => {
                  setMenuOpen(false)
                  await onDeleteColumn(column)
                }}
              >
                Delete column
              </button>
            </div>
          )}
        </div>
      </div>

      <CardList
        columnId={column.id}
        cards={cards}
        onRenameCard={onRenameCard}
        onDeleteCard={onDeleteCard}
      />

      <div className="mt-3">
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={async e => {
            if (e.key === 'Enter') await handleAddCard()
          }}
          className="w-full p-2 mb-2 bg-white text-black border border-gray-300 rounded text-sm"
          placeholder="New card title"
        />
        <button
          onClick={handleAddCard}
          className="w-full bg-gray-200 text-black py-1.5 rounded text-sm hover:bg-gray-300"
        >
          Add Card
        </button>
      </div>
    </div>
  )
}
