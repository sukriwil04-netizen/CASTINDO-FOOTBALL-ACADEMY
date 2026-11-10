import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';

export interface GeneratePdfOptions {
  filename?: string;
  elementId?: string;
  element?: HTMLElement;
}

export const exportReportToPdf = async ({
  filename = 'Rapor_Pemain_Castindo_FA.pdf',
  elementId,
  element,
}: GeneratePdfOptions): Promise<boolean> => {
  const targetElement = element || (elementId ? document.getElementById(elementId) : null);
  if (!targetElement) {
    console.error('Target element for PDF export not found');
    return false;
  }

  const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;

  try {
    // html2canvas-pro supports modern CSS color functions including oklch(), oklab(), and CSS variables
    const canvas = await html2canvas(targetElement, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: 1024,
    });

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pageWidth = pdf.internal.pageSize.getWidth(); // 210 mm
    const pageHeight = pdf.internal.pageSize.getHeight(); // 297 mm
    const marginX = 10;
    const marginY = 10;
    const printableWidth = pageWidth - marginX * 2; // 190 mm
    const printableHeight = pageHeight - marginY * 2; // 277 mm

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Height of one page in canvas pixels
    const pageHeightInCanvasPixels = Math.floor((canvasWidth * printableHeight) / printableWidth);

    if (canvasHeight <= pageHeightInCanvasPixels) {
      // Single page document
      const renderedHeight = (canvasHeight * printableWidth) / canvasWidth;
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      pdf.addImage(imgData, 'JPEG', marginX, marginY, printableWidth, renderedHeight);
    } else {
      // Multi-page document: slice canvas cleanly page by page
      let currentY = 0;
      let pageNumber = 0;

      while (currentY < canvasHeight) {
        const sliceHeight = Math.min(pageHeightInCanvasPixels, canvasHeight - currentY);

        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvasWidth;
        pageCanvas.height = sliceHeight;
        const ctx = pageCanvas.getContext('2d');

        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvasWidth, sliceHeight);
          ctx.drawImage(
            canvas,
            0,
            currentY,
            canvasWidth,
            sliceHeight,
            0,
            0,
            canvasWidth,
            sliceHeight
          );
        }

        const pageData = pageCanvas.toDataURL('image/jpeg', 0.95);
        const renderedSliceHeight = (sliceHeight * printableWidth) / canvasWidth;

        if (pageNumber > 0) {
          pdf.addPage();
        }
        pdf.addImage(pageData, 'JPEG', marginX, marginY, printableWidth, renderedSliceHeight);

        currentY += sliceHeight;
        pageNumber++;
      }
    }

    pdf.save(cleanFilename);
    return true;
  } catch (error) {
    console.error('Failed to export PDF via canvas, falling back to window.print():', error);
    // Graceful fallback: trigger native print dialog
    window.print();
    return false;
  }
};
