import type { AvailabilityPeriod, AvailabilityTime } from '../types/profile'

export const availabilityPeriodOptions: Array<{ value: AvailabilityPeriod; label: string }> = [
  { value: 'WEEKDAYS', label: 'Dias úteis' },
  { value: 'WEEKENDS', label: 'Fins de semana' },
]

export const availabilityTimeOptions: Array<{ value: AvailabilityTime; label: string }> = [
  { value: 'MORNING', label: 'Manhã' },
  { value: 'AFTERNOON', label: 'Tarde' },
  { value: 'EVENING', label: 'Noite' },
]

export function getAvailabilityPeriodLabel(period: AvailabilityPeriod) {
  return availabilityPeriodOptions.find((option) => option.value === period)?.label ?? period
}

export function getAvailabilityTimeLabel(time: AvailabilityTime) {
  return availabilityTimeOptions.find((option) => option.value === time)?.label ?? time
}

export function formatAvailabilitySummary(
  periods: AvailabilityPeriod[] = [],
  times: AvailabilityTime[] = [],
  notes?: string | null,
) {
  const parts = [
    periods.map(getAvailabilityPeriodLabel).join(' e '),
    times.map(getAvailabilityTimeLabel).join(', '),
    notes?.trim() ?? '',
  ].filter((part) => part.length > 0)

  return parts.length > 0 ? parts : ['Disponibilidade ainda não informada']
}
