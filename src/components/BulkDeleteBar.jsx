export default function BulkDeleteBar({
  selectedCount,
  onDelete,
  onCancel,
  itemLabel = 'item'
}) {
  if (selectedCount === 0) return null

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-white border border-red-200 rounded-2xl shadow-2xl px-6 py-4 flex items-center gap-4">
        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
          <span className="text-red-600 font-bold text-sm">{selectedCount}</span>
        </div>
        <span className="text-sm font-medium text-gray-700">
          {selectedCount} {itemLabel}(s) selected
        </span>
        <button
          onClick={onDelete}
          className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
        >
          🗑 Delete Selected
        </button>
        <button
          onClick={onCancel}
          className="text-gray-500 text-sm hover:text-gray-700 px-2 py-2"
        >
          ✕ Cancel
        </button>
      </div>
    </div>
  )
}
