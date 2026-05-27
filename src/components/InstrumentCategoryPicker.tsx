import { Check } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { capitalizeDisplayName } from '../lib/text-format'
import type { InstrumentCatalogItem } from '../types/catalog'

type InstrumentCategoryPickerProps = {
  emptyText: string
  error?: string
  getValue?: (item: InstrumentCatalogItem) => string
  isLoading?: boolean
  items: InstrumentCatalogItem[]
  label?: string
  onToggleValue: (value: string) => void
  selectedValues: string[]
}

export function InstrumentCategoryPicker({
  emptyText,
  error,
  getValue = (item) => item.id,
  isLoading = false,
  items,
  label = 'Instrumentos',
  onToggleValue,
  selectedValues,
}: InstrumentCategoryPickerProps) {
  const groupedItems = useMemo(() => groupInstrumentsByCategory(items), [items])
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null)
  const selectedValueSet = useMemo(() => new Set(selectedValues), [selectedValues])
  const activeGroup =
    groupedItems.find((group) => group.categoryId === activeCategoryId) ?? groupedItems[0] ?? null

  useEffect(() => {
    if (!activeGroup) {
      setActiveCategoryId(null)
      return
    }

    if (activeCategoryId !== activeGroup.categoryId) {
      setActiveCategoryId(activeGroup.categoryId)
    }
  }, [activeCategoryId, activeGroup])

  return (
    <fieldset className="min-w-0 rounded-lg border border-zinc-800 bg-[#141414] p-4">
      <legend className="px-1 text-sm font-bold text-zinc-100">{label}</legend>
      {isLoading ? <p className="mt-3 text-sm text-zinc-400">Carregando...</p> : null}
      {!isLoading && items.length === 0 ? <p className="mt-3 text-sm text-zinc-500">{emptyText}</p> : null}
      {groupedItems.length > 0 ? (
        <div className="mt-3 space-y-4">
          <div className="flex flex-wrap gap-2">
            {groupedItems.map((group) => {
              const selectedCount = group.items.filter((item) => selectedValueSet.has(getValue(item))).length
              const isActive = group.categoryId === activeGroup?.categoryId

              return (
                <button
                  className={[
                    'inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold transition',
                    isActive
                      ? 'border-[#1DC95A] bg-[#1DC95A] text-[#141414]'
                      : 'border-zinc-700 bg-[#181818] text-zinc-200 hover:bg-zinc-800',
                  ].join(' ')}
                  key={group.categoryId}
                  onClick={() => setActiveCategoryId(group.categoryId)}
                  type="button"
                >
                  {capitalizeDisplayName(group.categoryName)}
                  {selectedCount > 0 ? (
                    <span
                      className={[
                        'inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-xs',
                        isActive ? 'bg-[#141414] text-[#1DC95A]' : 'bg-[#1DC95A] text-[#141414]',
                      ].join(' ')}
                    >
                      {selectedCount}
                    </span>
                  ) : null}
                </button>
              )
            })}
          </div>

          {activeGroup ? (
            <div className="rounded-lg border border-zinc-800 bg-[#181818] p-3">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-sm font-bold text-zinc-100">{capitalizeDisplayName(activeGroup.categoryName)}</h3>
                <p className="text-xs text-zinc-500">{activeGroup.items.length} opções</p>
              </div>

              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3" role="listbox" aria-label={activeGroup.categoryName}>
                {activeGroup.items.map((item) => {
                  const value = getValue(item)
                  const isSelected = selectedValueSet.has(value)

                  return (
                    <button
                      aria-pressed={isSelected}
                      className={instrumentChoiceClassName(isSelected)}
                      key={item.id}
                      onClick={() => onToggleValue(value)}
                      type="button"
                    >
                      {isSelected ? <Check className="shrink-0" size={16} /> : null}
                      <span className="block truncate">{capitalizeDisplayName(item.name)}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
      {error ? <p className="mt-2 text-sm text-red-300">{error}</p> : null}
    </fieldset>
  )
}

function instrumentChoiceClassName(isSelected: boolean) {
  return [
    'inline-flex min-w-0 items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm font-semibold transition',
    isSelected
      ? 'border-[#1DC95A] bg-[#1DC95A] text-[#141414]'
      : 'border-zinc-800 bg-[#141414] text-zinc-200 hover:bg-zinc-800',
  ].join(' ')
}

function groupInstrumentsByCategory(items: InstrumentCatalogItem[]) {
  const grouped = new Map<string, { categoryId: string; categoryName: string; items: InstrumentCatalogItem[] }>()

  for (const item of items) {
    const existingGroup = grouped.get(item.categoryId)

    if (existingGroup) {
      existingGroup.items.push(item)
      continue
    }

    grouped.set(item.categoryId, {
      categoryId: item.categoryId,
      categoryName: item.category.name,
      items: [item],
    })
  }

  for (const group of grouped.values()) {
    group.items.sort((firstItem, secondItem) => compareDisplayText(firstItem.name, secondItem.name))
  }

  return Array.from(grouped.values()).sort((firstGroup, secondGroup) => {
    const firstOrder = getInstrumentCategoryOrder(firstGroup.categoryName)
    const secondOrder = getInstrumentCategoryOrder(secondGroup.categoryName)

    if (firstOrder !== secondOrder) {
      return firstOrder - secondOrder
    }

    return compareDisplayText(firstGroup.categoryName, secondGroup.categoryName)
  })
}

function getInstrumentCategoryOrder(categoryName: string) {
  const normalizedCategory = normalizeInstrumentCategoryName(categoryName)
  const orderedCategories = ['teclas', 'vocal', 'percussao', 'cordas', 'producao', 'composicao', 'sopro']
  const categoryIndex = orderedCategories.indexOf(normalizedCategory)

  if (categoryIndex >= 0) {
    return categoryIndex
  }

  return normalizedCategory === 'outros' ? orderedCategories.length + 1 : orderedCategories.length
}

function normalizeInstrumentCategoryName(categoryName: string) {
  return categoryName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

function compareDisplayText(firstText: string, secondText: string) {
  return firstText.localeCompare(secondText, 'pt-BR')
}
