export const validators = {
  required: (value) => value?.trim() ? null : 'This field is required',
  email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? null : 'Invalid email format',
  minLength: (min) => (value) => value?.length >= min ? null : `Minimum ${min} characters required`,
  maxLength: (max) => (value) => value?.length <= max ? null : `Maximum ${max} characters allowed`,
  url: (value) => {
    if (!value) return null
    try {
      new URL(value)
      return null
    } catch {
      return 'Invalid URL format'
    }
  },
  number: (value) => !isNaN(value) && !isNaN(parseFloat(value)) ? null : 'Must be a valid number',
  positiveNumber: (value) => parseFloat(value) > 0 ? null : 'Must be a positive number'
}

export const validateField = (value, validatorList = []) => {
  for (const validator of validatorList) {
    const error = validator(value)
    if (error) return error
  }
  return null
}

export const validateForm = (data, rules) => {
  const errors = {}
  for (const [field, validatorList] of Object.entries(rules)) {
    const error = validateField(data[field], validatorList)
    if (error) errors[field] = error
  }
  return Object.keys(errors).length > 0 ? errors : null
}