export function homePathForRoles(roles: Array<{ name: string }> | undefined): string {
  const names = (roles ?? []).map((role) => role.name)
  if (names.includes('admin')) {
    return '/'
  }
  if (names.includes('cashier')) {
    return '/kasir'
  }
  if (names.includes('accountant')) {
    return '/accounting/journal-entries'
  }
  if (names.includes('inventory')) {
    return '/inventory'
  }
  return '/'
}
