import * as XLSX from 'xlsx';

export function exportToExcel(data, fileName = 'Report') {
  if (!data || data.length === 0) {
    alert('No data available to export');
    return;
  }

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

  XLSX.writeFile(workbook, `${fileName}_${new Date().toISOString().substring(0, 10)}.xlsx`);
}
