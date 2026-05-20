import type { Gender } from '../types/profile'

export const genderOptions: Array<{ value: Gender; label: string }> = [
  { value: 'MALE', label: 'Masculino' },
  { value: 'FEMALE', label: 'Feminino' },
  { value: 'OTHER', label: 'Outro' },
  { value: 'PREFER_NOT_TO_SAY', label: 'Prefiro não dizer' },
]

export function getGenderLabel(gender: Gender | null | undefined) {
  return genderOptions.find((option) => option.value === gender)?.label ?? 'Gênero não informado'
}
