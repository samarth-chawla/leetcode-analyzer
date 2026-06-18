interface ValidationResult {
  valid: boolean
  error?: string
}

export function validateExtensionJSON(body: unknown): ValidationResult {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid file format. Expected a JSON object.' }
  }

  const data = body as Record<string, unknown>

  if (!data.version) {
    return { valid: false, error: 'Invalid file format. Missing version field.' }
  }

  const version = String(data.version)
  if (version !== '1.0' && version !== '1.0.0') {
    return {
      valid: false,
      error: 'Outdated extension file. Please update your extension and re-export.'
    }
  }

  if (!data.user || typeof data.user !== 'object') {
    return { valid: false, error: 'Invalid file format. Missing user object.' }
  }

  if (!Array.isArray(data.submissions)) {
    return { valid: false, error: 'Invalid file format. Missing submissions array.' }
  }

  if (data.submissions.length === 0) {
    return { valid: false, error: 'No submissions found in this file.' }
  }

  return { valid: true }
}
