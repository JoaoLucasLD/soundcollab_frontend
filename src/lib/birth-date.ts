export function calculateAge(birthDate: string | null | undefined) {
  if (!birthDate) {
    return null
  }

  const [year, month, day] = birthDate.split('-').map(Number)
  const today = new Date()
  let age = today.getFullYear() - year
  const currentMonth = today.getMonth() + 1
  const currentDay = today.getDate()

  if (currentMonth < month || (currentMonth === month && currentDay < day)) {
    age -= 1
  }

  return age
}

export function isValidBirthDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false
  }

  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(`${value}T00:00:00.000Z`)

  return (
    !Number.isNaN(date.getTime()) &&
    date.getUTCFullYear() === year &&
    date.getUTCMonth() + 1 === month &&
    date.getUTCDate() === day
  )
}

export function validateBirthDateAge(value: string) {
  if (!isValidBirthDate(value)) {
    return false
  }

  const age = calculateAge(value)
  return typeof age === 'number' && age >= 18 && age <= 100
}

export function formatBirthDateInput(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  const day = formatBirthDateDay(digits.slice(0, 2))
  const month = formatBirthDateMonth(digits.slice(2, 4))
  const year = digits.slice(4)

  if (digits.length <= 2) {
    return digits
  }

  if (digits.length <= 4) {
    return `${day}/${month}`
  }

  return `${day}/${month}/${year}`
}

function formatBirthDateDay(value: string) {
  if (value.length < 2) {
    return value
  }

  const day = Number(value)

  if (day < 1) {
    return '01'
  }

  if (day > 31) {
    return '31'
  }

  return value
}

function formatBirthDateMonth(value: string) {
  if (value.length < 2) {
    return value
  }

  const month = Number(value)

  if (month < 1) {
    return '01'
  }

  if (month > 12) {
    return '12'
  }

  return value
}

export function formatBirthDateForDisplay(value: string | null | undefined) {
  if (!value) {
    return ''
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-')
    return `${day}/${month}/${year}`
  }

  return formatBirthDateInput(value)
}

export function parseBirthDateDisplay(value: string) {
  const formattedValue = formatBirthDateInput(value)

  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(formattedValue)) {
    return formattedValue
  }

  const [day, month, year] = formattedValue.split('/')
  return `${year}-${month}-${day}`
}
