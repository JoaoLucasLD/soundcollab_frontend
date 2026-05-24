import { env } from '../config/env'

export type MapboxCitySuggestion = {
  id: string
  label: string
  latitude: number
  longitude: number
}

type MapboxFeature = {
  id?: string
  geometry?: {
    coordinates?: [number, number]
  }
  properties?: {
    mapbox_id?: string
    name?: string
    full_address?: string
    place_formatted?: string
  }
}

type MapboxGeocodingResponse = {
  features?: MapboxFeature[]
}

export async function searchMapboxCities(query: string): Promise<MapboxCitySuggestion[]> {
  const normalizedQuery = query.trim()

  if (normalizedQuery.length < 2 || !env.mapboxAccessToken) {
    return []
  }

  const params = new URLSearchParams({
    q: normalizedQuery,
    access_token: env.mapboxAccessToken,
    autocomplete: 'true',
    country: 'BR',
    language: 'pt',
    limit: '5',
    permanent: 'true',
    types: 'place',
  })

  const response = await fetch(`https://api.mapbox.com/search/geocode/v6/forward?${params.toString()}`)

  if (!response.ok) {
    throw new Error('Não foi possível buscar cidades agora.')
  }

  const data = (await response.json()) as MapboxGeocodingResponse

  return (data.features ?? []).flatMap((feature) => {
    const coordinates = feature.geometry?.coordinates
    const longitude = coordinates?.[0]
    const latitude = coordinates?.[1]
    const name = feature.properties?.name
    const formattedPlace = feature.properties?.place_formatted
    const fullAddress = feature.properties?.full_address
    const label = formatCityLabel(name, formattedPlace, fullAddress)

    if (!label || typeof latitude !== 'number' || typeof longitude !== 'number') {
      return []
    }

    return [
      {
        id: feature.properties?.mapbox_id ?? feature.id ?? `${label}-${latitude}-${longitude}`,
        label,
        latitude,
        longitude,
      },
    ]
  })
}

export function isMapboxConfigured() {
  return Boolean(env.mapboxAccessToken)
}

function formatCityLabel(name?: string, placeFormatted?: string, fullAddress?: string) {
  const suffix = placeFormatted ?? fullAddress

  if (!name) {
    return suffix ?? ''
  }

  if (!suffix) {
    return name
  }

  return `${name}, ${suffix}`
}
