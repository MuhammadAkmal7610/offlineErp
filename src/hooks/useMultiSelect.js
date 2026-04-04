import { useState } from 'react'

export const useMultiSelect = (items = []) => {
  const [selectedIds, setSelectedIds] = useState([])

  const isSelected = (id) => selectedIds.includes(id)

  const toggleOne = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const toggleAll = () => {
    if (selectedIds.length === items.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(items.map(i => i.id))
    }
  }

  const clearSelection = () => setSelectedIds([])

  const isAllSelected = items.length > 0 && selectedIds.length === items.length
  const isPartialSelected = selectedIds.length > 0 && selectedIds.length < items.length

  return {
    selectedIds,
    isSelected,
    toggleOne,
    toggleAll,
    clearSelection,
    isAllSelected,
    isPartialSelected,
    selectedCount: selectedIds.length
  }
}
