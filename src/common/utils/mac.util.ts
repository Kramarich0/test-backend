export function normalizeMacAddress(mac: string): string {
  return mac.trim().toUpperCase().replaceAll('-', ':');
}
