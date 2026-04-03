export function getNameFromToken(): string {
  const token = localStorage.getItem('token')
  if (!token) return 'Guest'
  try {
    const part = token.split('.')[1]
    if (!part) return ''
    const payload = JSON.parse(atob(part))
    return payload['custom:name'] ?? ''
  } catch {
    return ''
  }
}
