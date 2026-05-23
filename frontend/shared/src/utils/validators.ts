export interface FieldError {
  [key: string]: string | undefined
}

export function validateRequired(value: any, label: string): string | undefined {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return `${label} es obligatorio`
  }
  return undefined
}

export function validateEmail(value: string): string | undefined {
  if (!value) return undefined
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(value) ? undefined : 'Correo electr\u00f3nico inv\u00e1lido'
}

export function validateRUC(value: string): string | undefined {
  if (!value) return undefined
  return /^\d{13}$/.test(value.replace(/-/g, '')) ? undefined : 'RUC debe tener 13 d\u00edgitos'
}

export function validatePositive(value: number | string | undefined, label: string): string | undefined {
  if (value === undefined || value === null || value === '') return undefined
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return `${label} debe ser un n\u00famero v\u00e1lido`
  if (num <= 0) return `${label} debe ser mayor a 0`
  return undefined
}

export function validateNonNegative(value: number | string | undefined, label: string): string | undefined {
  if (value === undefined || value === null || value === '') return undefined
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return `${label} debe ser un n\u00famero v\u00e1lido`
  if (num < 0) return `${label} no puede ser negativo`
  return undefined
}

export function validateMinLength(value: string, min: number, label: string): string | undefined {
  if (!value) return undefined
  return value.trim().length >= min ? undefined : `${label} debe tener al menos ${min} caracteres`
}

export function validatePasswordStrength(value: string): string | undefined {
  if (!value) return undefined
  if (value.length < 8) return 'La contrase\u00f1a debe tener al menos 8 caracteres'
  if (!/[A-Z]/.test(value)) return 'La contrase\u00f1a debe tener al menos una may\u00fascula'
  if (!/[0-9]/.test(value)) return 'La contrase\u00f1a debe tener al menos un n\u00famero'
  return undefined
}

export function validateGreaterThan(
  value: number | string | undefined,
  compareTo: number | string | undefined,
  valueLabel: string,
  compareLabel: string
): string | undefined {
  if (value === undefined || value === null || value === '' ||
      compareTo === undefined || compareTo === null || compareTo === '') return undefined
  const v1 = typeof value === 'string' ? parseFloat(value) : value
  const v2 = typeof compareTo === 'string' ? parseFloat(compareTo) : compareTo
  if (isNaN(v1) || isNaN(v2)) return undefined
  if (v1 < v2) return `${valueLabel} debe ser mayor o igual a ${compareLabel}`
  return undefined
}

export function validateDateAfter(
  date: string | undefined,
  compareDate: string | undefined,
  label: string,
  compareLabel: string
): string | undefined {
  if (!date || !compareDate) return undefined
  if (new Date(date) < new Date(compareDate)) {
    return `${label} debe ser posterior a ${compareLabel}`
  }
  return undefined
}

export function validateNotEqual(
  value: any,
  compareTo: any,
  label: string,
  compareLabel: string
): string | undefined {
  if (value === undefined || value === null || value === '' || compareTo === undefined || compareTo === null || compareTo === '') return undefined
  if (String(value) === String(compareTo)) {
    return `${label} no puede ser igual a ${compareLabel}`
  }
  return undefined
}
