import * as XLSX from 'xlsx'
import { format } from 'date-fns'

export const exportToExcel = (data: any[], filename: string) => {
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Data')
  XLSX.writeFile(wb, `${filename}_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`)
}
