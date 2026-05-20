import type { CollaborationGoal } from '../types/profile'

export const collaborationGoalOptions = [
  { value: 'BAND', label: 'Formar banda' },
  { value: 'RECORDING', label: 'Gravar músicas' },
  { value: 'LIVE_SHOWS', label: 'Tocar ao vivo' },
  { value: 'COMPOSITION', label: 'Compor' },
  { value: 'PRODUCTION', label: 'Produção musical' },
  { value: 'STUDY', label: 'Estudar e praticar' },
  { value: 'CASUAL_JAM', label: 'Jam casual' },
] satisfies Array<{ value: CollaborationGoal; label: string }>

export function getCollaborationGoalLabel(goal: CollaborationGoal) {
  return collaborationGoalOptions.find((option) => option.value === goal)?.label ?? goal
}
