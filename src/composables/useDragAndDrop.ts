import { ref, type Ref } from 'vue'

export interface DragAndDropOptions<T> {
  /** Array of items to reorder */
  items: Ref<T[]>
  /** Callback after reorder */
  onReorder?: (items: T[]) => void
  /** Key to use for item identification */
  idKey?: keyof T
}

export interface DragState {
  isDragging: boolean
  dragIndex: number | null
  dropIndex: number | null
}

/**
 * Composable for drag and drop reordering
 *
 * @example
 * const items = ref([{ id: 1, name: 'Item 1' }, { id: 2, name: 'Item 2' }])
 * const { dragState, handleDragStart, handleDragOver, handleDrop, handleDragEnd } = useDragAndDrop({ items })
 *
 * <tr
 *   v-for="(item, index) in items"
 *   :key="item.id"
 *   draggable="true"
 *   :class="{ 'opacity-50': dragState.dragIndex === index }"
 *   @dragstart="handleDragStart(index, $event)"
 *   @dragover="handleDragOver(index, $event)"
 *   @drop="handleDrop(index, $event)"
 *   @dragend="handleDragEnd"
 * >
 */
export function useDragAndDrop<T>(options: DragAndDropOptions<T>) {
  const dragState = ref<DragState>({
    isDragging: false,
    dragIndex: null,
    dropIndex: null,
  })

  /**
   * Handle drag start
   */
  function handleDragStart(index: number, event: DragEvent) {
    dragState.value.isDragging = true
    dragState.value.dragIndex = index

    // Set drag data
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/plain', String(index))

      // Create a custom drag image (optional)
      const target = event.target as HTMLElement
      if (target) {
        event.dataTransfer.setDragImage(target, 0, 0)
      }
    }
  }

  /**
   * Handle drag over
   */
  function handleDragOver(index: number, event: DragEvent) {
    event.preventDefault()

    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move'
    }

    dragState.value.dropIndex = index
  }

  /**
   * Handle drop
   */
  function handleDrop(index: number, event: DragEvent) {
    event.preventDefault()

    const fromIndex = dragState.value.dragIndex
    const toIndex = index

    if (fromIndex === null || fromIndex === toIndex) {
      handleDragEnd()
      return
    }

    // Reorder items
    const items = [...options.items.value]
    const [movedItem] = items.splice(fromIndex, 1)
    if (movedItem) {
      items.splice(toIndex, 0, movedItem)
      options.items.value = items

      // Callback
      options.onReorder?.(items)
    }

    handleDragEnd()
  }

  /**
   * Handle drag end
   */
  function handleDragEnd() {
    dragState.value.isDragging = false
    dragState.value.dragIndex = null
    dragState.value.dropIndex = null
  }

  /**
   * Check if item is being dragged
   */
  function isDragging(index: number): boolean {
    return dragState.value.dragIndex === index
  }

  /**
   * Check if item is drop target
   */
  function isDropTarget(index: number): boolean {
    return dragState.value.dropIndex === index && dragState.value.dragIndex !== index
  }

  /**
   * Move item up
   */
  function moveUp(index: number) {
    if (index <= 0) return

    const items = [...options.items.value]
    const temp = items[index - 1]
    if (temp && items[index]) {
      items[index - 1] = items[index]!
      items[index] = temp
      options.items.value = items
      options.onReorder?.(items)
    }
  }

  /**
   * Move item down
   */
  function moveDown(index: number) {
    if (index >= options.items.value.length - 1) return

    const items = [...options.items.value]
    const temp = items[index + 1]
    if (temp && items[index]) {
      items[index + 1] = items[index]!
      items[index] = temp
      options.items.value = items
      options.onReorder?.(items)
    }
  }

  return {
    dragState,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
    isDragging,
    isDropTarget,
    moveUp,
    moveDown,
  }
}
