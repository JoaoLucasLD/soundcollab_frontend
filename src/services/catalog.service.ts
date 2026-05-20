import { api } from '../lib/api'
import type { ListCatalogItemsResponse, ListInstrumentCatalogItemsResponse } from '../types/catalog'

export async function listInstruments() {
  const { data } = await api.get<ListInstrumentCatalogItemsResponse>('/instruments')
  return data.items
}

export async function listStyles() {
  const { data } = await api.get<ListCatalogItemsResponse>('/styles')
  return data.items
}
