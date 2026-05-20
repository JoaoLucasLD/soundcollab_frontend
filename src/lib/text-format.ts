export function capitalizeDisplayName(value: string) {
  return value
    .split(' ')
    .map((word) => {
      if (word.length === 0) {
        return word
      }

      return word[0].toLocaleUpperCase('pt-BR') + word.slice(1)
    })
    .join(' ')
}
