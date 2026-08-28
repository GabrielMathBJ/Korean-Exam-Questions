import { toCanvas, toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

/**
 * Capture an HTML element and download it as a high-quality PDF.
 * If the element is longer than one A4 page, it splits it across multiple pages.
 */
export async function exportElementToPdf(
  element: HTMLElement,
  filename: string = '수능국어_시험지.pdf',
  onProgress?: (status: string) => void
): Promise<boolean> {
  try {
    if (onProgress) onProgress('시험지 렌더링 준비 중...');

    // html-to-image supports modern CSS like oklch and lab colors natively via SVG foreignObject
    const canvas = await toCanvas(element, {
      pixelRatio: 2, // High resolution for crisp Korean fonts
      backgroundColor: '#ffffff',
      cacheBust: true,
    });

    if (onProgress) onProgress('PDF 문서 생성 중...');

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const margin = 8; // 8mm margin
    const contentWidth = pageWidth - margin * 2;
    const contentHeight = (canvas.height * contentWidth) / canvas.width;

    let heightLeft = contentHeight;
    let position = margin;

    // First page
    pdf.addImage(imgData, 'PNG', margin, position, contentWidth, contentHeight, '', 'FAST');
    heightLeft -= (pageHeight - margin * 2);

    // Subsequent pages if the content spans multiple pages
    while (heightLeft > 0) {
      position = heightLeft - contentHeight + margin;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', margin, position, contentWidth, contentHeight, '', 'FAST');
      heightLeft -= (pageHeight - margin * 2);
    }

    pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
    return true;
  } catch (error) {
    console.error('Failed to export PDF:', error);
    return false;
  }
}

/**
 * Capture an HTML element and download it as a high-resolution PNG image.
 */
export async function exportElementToImage(
  element: HTMLElement,
  filename: string = '수능국어_시험지.png',
  onProgress?: (status: string) => void
): Promise<boolean> {
  try {
    if (onProgress) onProgress('시험지 고화질 이미지 생성 중...');

    const dataUrl = await toPng(element, {
      pixelRatio: 2,
      backgroundColor: '#ffffff',
      cacheBust: true,
    });

    if (onProgress) onProgress('이미지 다운로드 준비 중...');

    const downloadLink = document.createElement('a');
    downloadLink.href = dataUrl;
    downloadLink.download = filename.endsWith('.png') ? filename : `${filename}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    return true;
  } catch (error) {
    console.error('Failed to export image:', error);
    return false;
  }
}

/**
 * Print an element directly via a hidden iframe to bypass iframe restrictions.
 */
export function printElementDirectly(element: HTMLElement, title: string = '수능 시험지 인쇄') {
  try {
    // Create an invisible iframe
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      window.print();
      return;
    }

    // Collect style tags from current document
    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(node => node.outerHTML)
      .join('\n');

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${title}</title>
          ${styles}
          <style>
            @media print {
              body {
                background: white !important;
                color: black !important;
                margin: 0 !important;
                padding: 10mm !important;
                font-family: 'Nanum Myeongjo', 'Batang', serif !important;
              }
              .no-print {
                display: none !important;
              }
            }
          </style>
        </head>
        <body>
          ${element.outerHTML}
        </body>
      </html>
    `);
    doc.close();

    // Trigger print after resources load
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 500);
  } catch (e) {
    console.warn('Iframe print failed, falling back to window.print():', e);
    window.print();
  }
}
