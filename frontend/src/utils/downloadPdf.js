import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * Capture a ticket card as a print-style (white) multi-page PDF.
 */
export async function downloadElementAsPdf(element, filename = 'ticket.pdf') {
  if (!element) {
    throw new Error('Nothing to export');
  }

  const host = document.createElement('div');
  host.className = 'ticket-export-host';
  host.setAttribute('aria-hidden', 'true');

  const clone = element.cloneNode(true);
  clone.classList.add('ticket-export-sheet');
  clone.querySelectorAll('.no-print').forEach((node) => node.remove());
  clone.querySelectorAll('[disabled]').forEach((node) => node.removeAttribute('disabled'));

  host.appendChild(clone);
  document.body.appendChild(host);

  try {
    const canvas = await html2canvas(clone, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: clone.scrollWidth,
      windowHeight: clone.scrollHeight,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const usableWidth = pageWidth - margin * 2;
    const usableHeight = pageHeight - margin * 2;
    const imgHeight = (canvas.height * usableWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = margin;

    pdf.addImage(imgData, 'PNG', margin, position, usableWidth, imgHeight);
    heightLeft -= usableHeight;

    while (heightLeft > 0) {
      position = margin - (imgHeight - heightLeft);
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', margin, position, usableWidth, imgHeight);
      heightLeft -= usableHeight;
    }

    const safeName = String(filename || 'ticket.pdf').replace(/[^\w.-]+/g, '_');
    pdf.save(safeName.endsWith('.pdf') ? safeName : `${safeName}.pdf`);
  } finally {
    host.remove();
  }
}
