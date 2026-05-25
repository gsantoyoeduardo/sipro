/**
 * Funciones de validación de formularios.
 * Cada función retorna un string de error o undefined si es válido.
 * Se utilizan en todos los formularios CRUD de la aplicación.
 */
export interface FieldError {
  [key: string]: string | undefined
}

/** Valida que un campo no esté vacío ni sea solo espacios */
export function validateRequired(value: any, label: string): string | undefined {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return `${label} es obligatorio`
  }
  return undefined
}

/** Valida el formato de un correo electrónico */
export function validateEmail(value: string): string | undefined {
  if (!value) return undefined
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(value) ? undefined : 'Correo electrónico inválido'
}

/** Valida que el RUC tenga exactamente 13 dígitos (formato ecuatoriano) */
export function validateRUC(value: string): string | undefined {
  if (!value) return undefined
  return /^\d{13}$/.test(value.replace(/-/g, '')) ? undefined : 'RUC debe tener 13 dígitos'
}

/** Valida que un valor numérico sea positivo (mayor a 0) */
export function validatePositive(value: number | string | undefined, label: string): string | undefined {
  if (value === undefined || value === null || value === '') return undefined
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return `${label} debe ser un número válido`
  if (num <= 0) return `${label} debe ser mayor a 0`
  return undefined
}

/** Valida que un valor numérico no sea negativo (0 o mayor) */
export function validateNonNegative(value: number | string | undefined, label: string): string | undefined {
  if (value === undefined || value === null || value === '') return undefined
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return `${label} debe ser un número válido`
  if (num < 0) return `${label} no puede ser negativo`
  return undefined
}

/** Valida que un string tenga una longitud mínima de caracteres */
export function validateMinLength(value: string, min: number, label: string): string | undefined {
  if (!value) return undefined
  return value.trim().length >= min ? undefined : `${label} debe tener al menos ${min} caracteres`
}

/** Valida la fortaleza de una contraseña: mín 8 caracteres, una mayúscula y un número */
export function validatePasswordStrength(value: string): string | undefined {
  if (!value) return undefined
  if (value.length < 8) return 'La contraseña debe tener al menos 8 caracteres'
  if (!/[A-Z]/.test(value)) return 'La contraseña debe tener al menos una mayúscula'
  if (!/[0-9]/.test(value)) return 'La contraseña debe tener al menos un número'
  return undefined
}

/** Valida que un valor numérico sea mayor o igual a otro valor */
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

/** Valida que una fecha sea posterior a otra fecha */
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

/** Valida que dos valores no sean iguales (ej. nodo origen y destino) */
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
