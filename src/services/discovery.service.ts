import { api } from '../lib/api'
import type {
  DiscoveryMusicianResponse,
  DiscoveryMusiciansFilters,
  DiscoveryMusiciansResponse,
  MatchmakingRankingResponse,
} from '../types/discovery'

export async function listDiscoveryMusicians(filters: DiscoveryMusiciansFilters) {
  const { data } = await api.get<MatchmakingRankingResponse>('/matchmaking/ranking', {
    params: filters,
  })

  const musicians = [...data.ranking].sort(compareMusiciansByTotalScore)

  return {
    musicians,
    total: data.total,
  } satisfies DiscoveryMusiciansResponse
}

function compareMusiciansByTotalScore(first: DiscoveryMusicianResponse, second: DiscoveryMusicianResponse) {
  return (second.totalScore ?? 0) - (first.totalScore ?? 0)
}
