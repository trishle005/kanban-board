// app/boards/[id]/page.tsx
'use client'

import { gql, useSubscription, useMutation } from '@apollo/client'
import { useParams } from 'next/navigation'
import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'

import SortableColumn from './dnd-column'

import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  pointerWithin,
  rectIntersection
} from '@dnd-kit/core'

import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove
} from '@dnd-kit/sortable'

import type { ColumnType, Card } from './cardlist'

/* ============================
   GRAPHQL SUBSCRIPTIONS
============================ */

const BOARD_INFO = gql`
  subscription BoardInfo($id: uuid!) {
    boards_by_pk(id: $id) {
      id
      name
    }
  }
`

const BOARD_COLUMNS = gql`
  subscription BoardColumns($id: uuid!) {
    columns(where: { board_id: { _eq: $id } }, order_by: { position: asc }) {
      id
      name
      position
    }
  }
`

const BOARD_CARDS = gql`
  subscription BoardCards($id: uuid!) {
    cards(
      where: { column: { board_id: { _eq: $id } } }
      order_by: { position: asc }
    ) {
      id
      title
      position
      column_id
    }
  }
`

/* ============================
   GRAPHQL MUTATIONS
============================ */

const CREATE_COLUMN = gql`
  mutation CreateColumn($board_id: uuid!, $name: String!, $position: numeric!) {
    insert_columns_one(
      object: { board_id: $board_id, name: $name, position: $position }
    ) {
      id
    }
  }
`

const UPDATE_COLUMN_POSITION = gql`
  mutation UpdateColumnPosition($id: uuid!, $position: numeric!) {
    update_columns_by_pk(
      pk_columns: { id: $id }
      _set: { position: $position }
    ) {
      id
      position
    }
  }
`

const UPDATE_COLUMNS_MANY = gql`
  mutation UpdateColumnsMany($updates: [columns_updates!]!) {
    update_columns_many(updates: $updates) {
      affected_rows
    }
  }
`

const UPDATE_COLUMN_NAME = gql`
  mutation UpdateColumnName($id: uuid!, $name: String!) {
    update_columns_by_pk(pk_columns: { id: $id }, _set: { name: $name }) {
      id
      name
    }
  }
`

const DELETE_COLUMN = gql`
  mutation DeleteColumn($id: uuid!) {
    delete_columns_by_pk(id: $id) {
      id
    }
  }
`

const CREATE_CARD = gql`
  mutation CreateCard(
    $column_id: uuid!
    $title: String!
    $position: numeric!
  ) {
    insert_cards_one(
      object: { column_id: $column_id, title: $title, position: $position }
    ) {
      id
    }
  }
`

const UPDATE_CARDS_MANY = gql`
  mutation UpdateCardsMany($updates: [cards_updates!]!) {
    update_cards_many(updates: $updates) {
      affected_rows
    }
  }
`

const UPDATE_CARD_TITLE = gql`
  mutation UpdateCardTitle($id: uuid!, $title: String!) {
    update_cards_by_pk(pk_columns: { id: $id }, _set: { title: $title }) {
      id
      title
    }
  }
`

const DELETE_CARD = gql`
  mutation DeleteCard($id: uuid!) {
    delete_cards_by_pk(id: $id) {
      id
    }
  }
`

/* ============================
   COMPONENT
============================ */

export default function BoardPage() {
  const params = useParams()
  const boardId = params.id as string

  const { data: info, loading: loadingInfo } = useSubscription(BOARD_INFO, {
    variables: { id: boardId }
  })

  const { data: cols, loading: loadingCols } = useSubscription(BOARD_COLUMNS, {
    variables: { id: boardId }
  })

  const { data: crds, loading: loadingCards } = useSubscription(BOARD_CARDS, {
    variables: { id: boardId }
  })

  const [createColumn] = useMutation(CREATE_COLUMN)
  const [updateColumnPosition] = useMutation(UPDATE_COLUMN_POSITION)
  const [updateColumnsMany] = useMutation(UPDATE_COLUMNS_MANY)
  const [updateColumnName] = useMutation(UPDATE_COLUMN_NAME)
  const [deleteColumn] = useMutation(DELETE_COLUMN)

  const [createCard] = useMutation(CREATE_CARD)
  const [updateCardsMany] = useMutation(UPDATE_CARDS_MANY)
  const [updateCardTitle] = useMutation(UPDATE_CARD_TITLE)
  const [deleteCard] = useMutation(DELETE_CARD)

  const [newColName, setNewColName] = useState('')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [localCards, setLocalCards] = useState<Card[]>([])
  const [localColumns, setLocalColumns] = useState<ColumnType[]>([])

  useEffect(() => {
    if (crds?.cards) setLocalCards(crds.cards)
  }, [crds?.cards])

  useEffect(() => {
    if (cols?.columns) setLocalColumns(cols.columns)
  }, [cols?.columns])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } })
  )

  const collisionDetection = useMemo(
    () => (args: Parameters<typeof pointerWithin>[0]) => {
      const pointerCollisions = pointerWithin(args)
      if (pointerCollisions.length > 0) return pointerCollisions
      return rectIntersection(args)
    },
    []
  )

  if (loadingInfo || loadingCols || loadingCards) return <div>Loading...</div>

  const board = info?.boards_by_pk
  const columns = localColumns
  const cards = localCards

  /* create column */
  async function handleAddColumn() {
    const name = newColName.trim()
    if (!name) return
    await createColumn({
      variables: { board_id: boardId, name, position: columns.length }
    })
    setNewColName('')
  }

  /* card ops */
  async function handleAddCard(columnId: string, title: string) {
    const count = cards.filter(c => c.column_id === columnId).length
    await createCard({
      variables: { column_id: columnId, title: title.trim(), position: count }
    })
  }

  async function handleRenameCard(cardId: string, newTitle: string) {
    const title = newTitle.trim()
    if (!title) return
    setLocalCards(prev => prev.map(c => (c.id === cardId ? { ...c, title } : c)))
    await updateCardTitle({ variables: { id: cardId, title } })
  }

  async function handleDeleteCard(card: Card) {
    setLocalCards(prev => prev.filter(c => c.id !== card.id))
    await deleteCard({ variables: { id: card.id } })
    const remaining = cards
      .filter(c => c.column_id === card.column_id && c.id !== card.id)
      .sort((a, b) => Number(a.position) - Number(b.position))
    const updates = remaining.map((c, i) => ({
      where: { id: { _eq: c.id } },
      _set: { position: i }
    }))
    if (updates.length) await updateCardsMany({ variables: { updates } })
  }

  /* column ops: rename, delete, reorder */
  async function handleRenameColumn(id: string, nameRaw: string) {
    const name = nameRaw.trim()
    if (!name) return
    setLocalColumns(prev => prev.map(col => (col.id === id ? { ...col, name } : col)))
    await updateColumnName({ variables: { id, name } })
  }

  async function handleDeleteColumn(col: ColumnType) {
    // optimistic remove column and its cards from local state
    setLocalColumns(prev => prev.filter(c => c.id !== col.id))
    setLocalCards(prev => prev.filter(card => card.column_id !== col.id))

    await deleteColumn({ variables: { id: col.id } })

    // reindex remaining columns
    const remaining = columns
      .filter(c => c.id !== col.id)
      .sort((a, b) => Number(a.position) - Number(b.position))
    const updates = remaining.map((c, i) => ({
      where: { id: { _eq: c.id } },
      _set: { position: i }
    }))
    if (updates.length) await updateColumnsMany({ variables: { updates } })
  }

  async function reorderColumns(activeId: string, overId: string) {
    const activeIndex = columns.findIndex(col => col.id === activeId)
    const overIndex = columns.findIndex(col => col.id === overId)
    if (activeIndex === -1 || overIndex === -1) return

    const newColumns = arrayMove(columns, activeIndex, overIndex)
    const withPositions = newColumns.map((col, index) => ({ ...col, position: index }))
    setLocalColumns(withPositions)
    await Promise.all(
      withPositions.map(col =>
        updateColumnPosition({ variables: { id: col.id, position: col.position } })
      )
    )
  }

  /* drag handlers */
  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id))
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)
    if (!over) return

    const activeId = String(active.id)
    const overId = String(over.id)
    if (activeId === overId) return

    const isActiveAColumn = columns.some(col => col.id === activeId)
    if (isActiveAColumn) {
      await reorderColumns(activeId, overId)
      return
    }

    const activeCard = cards.find(c => c.id === activeId)
    if (!activeCard) return

    const overCard = cards.find(c => c.id === overId)
    if (overCard) {
      if (activeCard.column_id === overCard.column_id) {
        const columnCards = cards
          .filter(c => c.column_id === activeCard.column_id)
          .sort((a, b) => Number(a.position) - Number(b.position))
        const oldIndex = columnCards.findIndex(c => c.id === activeCard.id)
        const newIndex = columnCards.findIndex(c => c.id === overCard.id)
        if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return
        const reordered = arrayMove(columnCards, oldIndex, newIndex)
        const withPos = reordered.map((card, idx) => ({ ...card, position: idx }))
        setLocalCards(prev =>
          prev.map(c => {
            const m = withPos.find(x => x.id === c.id)
            return m ? m : c
          })
        )
        const updates = withPos.map(card => ({
          where: { id: { _eq: card.id } },
          _set: { position: card.position }
        }))
        await updateCardsMany({ variables: { updates } })
      } else {
        await moveCardToColumn(activeCard, overCard.column_id)
      }
      return
    }

    const overColumn = columns.find(col => col.id === overId)
    if (overColumn) await moveCardToColumn(activeCard, overColumn.id)
  }

  async function moveCardToColumn(activeCard: Card, targetColumnId: string) {
    const sourceColumnId = activeCard.column_id
    if (sourceColumnId === targetColumnId) return

    const sourceCards = cards
      .filter(c => c.column_id === sourceColumnId && c.id !== activeCard.id)
      .sort((a, b) => Number(a.position) - Number(b.position))

    const targetCards = cards
      .filter(c => c.column_id === targetColumnId)
      .sort((a, b) => Number(a.position) - Number(b.position))

    const newTargetCards = [...targetCards, { ...activeCard, column_id: targetColumnId }]

    const sourceWithPos = sourceCards.map((card, index) => ({ ...card, position: index }))
    const targetWithPos = newTargetCards.map((card, index) => ({
      ...card,
      position: index,
      column_id: targetColumnId
    }))

    const allReindexed = [...sourceWithPos, ...targetWithPos]

    setLocalCards(prev =>
      prev.map(c => {
        const m = allReindexed.find(x => x.id === c.id)
        return m ? m : c
      })
    )

    const updates = allReindexed.map(card => ({
      where: { id: { _eq: card.id } },
      _set: { column_id: card.column_id, position: card.position }
    }))
    await updateCardsMany({ variables: { updates } })
  }

  const activeCard = activeId ? cards.find(c => c.id === activeId) : null
  const activeColumn = activeId ? columns.find(col => col.id === activeId) : null

  return (
    <div className="min-h-screen bg-pink-300 text-black p-6">
      <h1 className="text-4xl font-bold mb-10 text-center">{board?.name}</h1>

      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={columns.map(c => c.id)}
          strategy={horizontalListSortingStrategy}
        >
          <div className="flex gap-6 overflow-x-auto pb-10">
            {columns.map(col => (
              <SortableColumn
                key={col.id}
                column={col}
                cards={cards.filter(c => c.column_id === col.id)}
                onAddCard={handleAddCard}
                onRenameCard={handleRenameCard}
                onDeleteCard={handleDeleteCard}
                onRenameColumn={handleRenameColumn}
                onDeleteColumn={handleDeleteColumn}
              />
            ))}

            <div className="w-64 bg-pink-200 p-4 rounded-2xl border border-pink-400 shadow flex-shrink-0">
              <input
                value={newColName}
                onChange={e => setNewColName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddColumn()}
                className="w-full p-2 mb-3 bg-white text-black border border-gray-300 rounded"
                placeholder="New column name"
              />
              <button
                onClick={handleAddColumn}
                className="w-full bg-gray-200 text-black py-2 rounded hover:bg-gray-300"
              >
                Add Column
              </button>
            </div>
          </div>
        </SortableContext>

        {typeof window !== 'undefined' &&
          createPortal(
            <DragOverlay>
              {activeColumn ? (
                <div className="w-64 bg-pink-200 p-4 rounded-2xl border border-pink-400 shadow opacity-90 cursor-grabbing">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="h-6 flex items-center gap-0.5">
                        <span className="w-1 h-5 bg-pink-500 rounded-full" />
                        <span className="w-1 h-5 bg-pink-500 rounded-full" />
                        <span className="w-1 h-5 bg-pink-500 rounded-full" />
                      </span>
                      <span className="font-semibold truncate">
                        {activeColumn.name}
                      </span>
                    </div>
                  </div>
                </div>
              ) : activeCard ? (
                <div className="bg-white border border-pink-300 rounded-xl p-3 shadow opacity-90 max-w-xs cursor-grabbing">
                  <p className="text-sm font-medium break-words">
                    {activeCard.title}
                  </p>
                </div>
              ) : null}
            </DragOverlay>,
            document.body
          )}
      </DndContext>
    </div>
  )
}
