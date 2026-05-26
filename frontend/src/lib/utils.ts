import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}

export function truncate(str: string, n = 50) {
  return str && str.length > n ? str.slice(0, n) + '…' : str
}

export function statusBadgeClass(status: string) {
  switch (status) {
    case 'sent': return 'badge-sent'
    case 'failed': return 'badge-failed'
    case 'pending': return 'badge-pending'
    case 'scheduled': return 'badge-scheduled'
    case 'cancelled': return 'badge-cancelled'
    default: return 'badge-pending'
  }
}
