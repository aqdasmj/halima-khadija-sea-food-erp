import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export async function exportToPdf(elementId, fileName = 'Report') {
  const element = document.getElementById(elementId);
  if (!element) {
    alert('Export element not found');
    return;
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#0a1128'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${fileName}_${new Date().toISOString().substring(0, 10)}.pdf`);
  } catch (err) {
    console.error('PDF export error:', err);
    alert('Failed to generate PDF. You can also use browser Print (Ctrl+P).');
  }
}
