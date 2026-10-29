/**
 * Client-side text extractor for CV files.
 * Supports: Plain Text (.txt), Word Documents (.docx), and PDF (.pdf).
 * All processing is strictly performed in-browser using local web APIs.
 */

import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Configure pdfjs worker using unpkg or dynamic worker module
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  // Use local or cdn worker fallback
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

export async function extractTextFromFile(file) {
  if (!file) throw new Error('No file provided');

  const extension = file.name.split('.').pop().toLowerCase();

  if (extension === 'txt') {
    return await file.text();
  }

  if (extension === 'docx') {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value || '';
  }

  if (extension === 'pdf') {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let fullText = '';

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageStrings = textContent.items.map((item) => item.str);
      fullText += pageStrings.join(' ') + '\n\n';
    }

    return fullText.trim();
  }

  throw new Error(`Unsupported file type: .${extension}. Supported formats: PDF, DOCX, TXT`);
}
