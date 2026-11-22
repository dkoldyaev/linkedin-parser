interface PdfTextItem {
  str?: string;
  hasEOL?: boolean;
}

async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await import('pdfjs-dist');
  // @ts-expect-error Vite/Bundler ?url import
  const { default: workerUrl } = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
  const loadingTask = pdfjs.getDocument({ data: await file.arrayBuffer() });
  try {
    const pdf = await loadingTask.promise;
    const pages: string[] = [];
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      const pageText = (content.items as PdfTextItem[])
        .map((item) => (item.str || '') + (item.hasEOL ? '\n' : ' '))
        .join('')
        .trim();
      pages.push(pageText);
    }
    const text = pages.join('\n\n').trim();
    if (!text) throw new Error('PDF does not contain selectable text.');
    return text;
  } finally {
    await loadingTask.destroy();
  }
}

const TEXT_EXTENSIONS = new Set(['md', 'markdown', 'txt', 'json']);

/** Extract CV text in the browser without uploading the original file. */
export async function extractTextFromFile(file: File): Promise<string> {
  if (!file) throw new Error('No file provided');

  const extension = (file.name.split('.').pop() || '').toLowerCase();

  if (extension === 'pdf') {
    return extractPdfText(file);
  }

  if (TEXT_EXTENSIONS.has(extension)) {
    return file.text();
  }

  throw new Error(`Unsupported file type: .${extension}. Supported formats: PDF, MD, JSON, TXT`);
}
