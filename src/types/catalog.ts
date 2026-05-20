export type CatalogItem = {
  id: string
  name: string
}

export type InstrumentCategory = {
  id: string
  name: string
}

export type InstrumentCatalogItem = CatalogItem & {
  categoryId: string
  category: InstrumentCategory
}

export type ListCatalogItemsResponse = {
  items: CatalogItem[]
  total: number
}

export type ListInstrumentCatalogItemsResponse = {
  items: InstrumentCatalogItem[]
  total: number
}
