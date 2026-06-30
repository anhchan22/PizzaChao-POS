export function formatWorkedMinutes(minutes?: number | null) {
  if (minutes === null || minutes === undefined) return '—'

  const safeMinutes = Math.max(0, Math.round(minutes))
  const hours = Math.floor(safeMinutes / 60)
  const remainingMinutes = safeMinutes % 60

  if (hours === 0) return `${remainingMinutes} phút`
  if (remainingMinutes === 0) return `${hours} giờ`

  return `${hours} giờ ${remainingMinutes} phút`
}

export function formatDateTime(value?: string | null) {
  return value ? new Date(value).toLocaleString('vi-VN') : '—'
}

export function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString('vi-VN') : '—'
}

export function getDefaultDateRange() {
  const today = new Date()
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)

  return {
    fromDate: toDateInputValue(firstDay),
    toDate: toDateInputValue(today),
  }
}

export function toDateInputValue(date: Date) {
  const offsetMs = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 10)
}

export function isRangeLongerThanOneMonth(fromDate: string, toDate: string) {
  if (!fromDate || !toDate) return false

  const from = new Date(`${fromDate}T00:00:00`)
  const to = new Date(`${toDate}T00:00:00`)
  const maxTo = new Date(from)
  maxTo.setMonth(maxTo.getMonth() + 1)

  return to > maxTo
}
