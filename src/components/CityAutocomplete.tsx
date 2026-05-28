import { MapPin } from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import {
  isMapboxConfigured,
  searchMapboxCities,
  type MapboxCitySuggestion,
} from '../lib/mapbox'

type CityAutocompleteProps = {
  disabled?: boolean
  inputClassName: string
  onChange: (value: string) => void
  onSelect: (city: MapboxCitySuggestion) => void
  placeholder?: string
  value: string
}

export function CityAutocomplete({
  disabled,
  inputClassName,
  onChange,
  onSelect,
  placeholder = 'Digite sua cidade',
  value,
}: CityAutocompleteProps) {
  const listboxId = useId()
  const [isFocused, setIsFocused] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<MapboxCitySuggestion[]>([])
  const trimmedValue = value.trim()
  const shouldSearch = isFocused && trimmedValue.length >= 2

  useEffect(() => {
    if (!shouldSearch) {
      setSuggestions([])
      setError(null)
      setIsLoading(false)
      return
    }

    let isCurrent = true
    const timeoutId = window.setTimeout(async () => {
      setIsLoading(true)
      setError(null)

      try {
        const nextSuggestions = await searchMapboxCities(trimmedValue)

        if (isCurrent) {
          setSuggestions(nextSuggestions)
        }
      } catch {
        if (isCurrent) {
          setSuggestions([])
          setError('Não foi possível buscar cidades agora.')
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false)
        }
      }
    }, 350)

    return () => {
      isCurrent = false
      window.clearTimeout(timeoutId)
    }
  }, [shouldSearch, trimmedValue])

  function handleSelect(suggestion: MapboxCitySuggestion) {
    onSelect(suggestion)
    setSuggestions([])
    setIsFocused(false)
  }

  const showSuggestions = isFocused && suggestions.length > 0
  const helperMessage = getHelperMessage({
    error,
    isLoading,
    isSearching: shouldSearch,
    suggestionsCount: suggestions.length,
  })

  return (
    <div className="relative">
      <input
        aria-autocomplete="list"
        aria-controls={listboxId}
        aria-expanded={showSuggestions}
        className={inputClassName}
        disabled={disabled}
        onBlur={() => window.setTimeout(() => setIsFocused(false), 120)}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => setIsFocused(true)}
        placeholder={placeholder}
        role="combobox"
        value={value}
      />

      {showSuggestions ? (
        <ul
          className="absolute z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-lg border border-zinc-700 bg-[#141414] p-1 shadow-xl shadow-black/40"
          id={listboxId}
          role="listbox"
        >
          {suggestions.map((suggestion) => (
            <li key={suggestion.id}>
              <div
                className="flex w-full min-w-0 cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-semibold text-zinc-100 transition hover:bg-zinc-800 focus:bg-zinc-800 focus:outline-none"
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    handleSelect(suggestion)
                  }
                }}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handleSelect(suggestion)}
                role="option"
                tabIndex={0}
              >
                <MapPin className="shrink-0 text-[#1DC95A]" size={16} />
                <span className="truncate">{suggestion.label}</span>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {helperMessage ? <p className="mt-2 text-xs text-zinc-500">{helperMessage}</p> : null}
    </div>
  )
}

type HelperMessageInput = {
  error: string | null
  isLoading: boolean
  isSearching: boolean
  suggestionsCount: number
}

function getHelperMessage({ error, isLoading, isSearching, suggestionsCount }: HelperMessageInput) {

  if (error) {
    return error
  }

  if (isLoading) {
    return 'Buscando cidades...'
  }

  if (isSearching && suggestionsCount === 0) {
    return 'Digite e selecione uma cidade para salvar coordenadas.'
  }

  return null
}
