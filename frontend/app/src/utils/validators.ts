/**
 * Funciones de validaci\u00f3n de formularios.
 * Cada funci\u00f3n retorna un string de error o undefined si es v\u00e1lido.
 * Se utilizan en todos los formularios CRUD de la aplicaci\u00f3n.
 */
export interface FieldError {
  [key: string]: string | undefined
}

/** Valida que un campo no est\u00e9 vac\u00edo ni sea solo espacios */
export function validateRequired(value: any, label: string): string | undefined {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return ${label} es obligatorio
  }
  return undefined
}

/** Valida el formato de un correo electr\u00f3nico */
export function validateEmail(value: string): string | undefined {
  if (!value) return undefined
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(value) ? undefined : 'Correo electr\u00f3nico inv\u00e1lido'
}

/** Valida que el RUC tenga exactamente 13 d\u00edgitos (formato ecuatoriano) */
export function validateRUC(value: string): string | undefined {
  if (!value) return undefined
  return /^\d{13}$/.test(value.replace(/-/g, '')) ? undefined : 'RUC debe tener 13 d\u00edgitos'
}

/** Valida que un valor num\u00e9rico sea positivo (mayor a 0) */
export function validatePositive(value: number | string | undefined, label: string): string | undefined {
  if (value === undefined || value === null || value === '') return undefined
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return ${label} debe ser un n\u00famero v\u00e1lido
  if (num <= 0) return ${label} debe ser mayor a 0
  return undefined
}

/** Valida que un valor num\u00e9rico no sea negativo (0 o mayor) */
export function validateNonNegative(value: number | string | undefined, label: string): string | undefined {
  if (value === undefined || value === null || value === '') return undefined
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return ${label} debe ser un n\u00famero v\u00e1lido
  if (num < 0) return ${label} no puede ser negativo
  return undefined
}

/** Valida que un string tenga una longitud m\u00ednima de caracteres */
export function validateMinLength(value: string, min: number, label: string): string | undefined {
  if (!value) return undefined
  return value.trim().length >= min ? undefined : ${label} debe tener al menos  caracteres
}

/** Valida la fortaleza de una contrase\u00f1a: m\u00edn 8 caracteres, una may\u00fascula y un n\u00famero */
export function validatePasswordStrength(value: string): string | undefined {
  if (!value) return undefined
  if (value.length < 8) return 'La contrase\u00f1a debe tener al menos 8 caracteres'
  if (!/[A-Z]/.test(value)) return 'La contrase\u00f1a debe tener al menos una may\u00fascula'
  if (!/[0-9]/.test(value)) return 'La contrase\u00f1a debe tener al menos un n\u00famero'
  return undefined
}

/** Valida que un valor num\u00e9rico sea mayor o igual a otro valor */
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
  if (v1 < v2) return ${valueLabel} debe ser mayor o igual a 
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
    return ${label} debe ser posterior a 
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
    return ${label} no puede ser igual a 
  }
  return undefined
}
