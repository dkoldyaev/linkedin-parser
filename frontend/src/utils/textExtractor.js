/** Extract CV text in the browser without uploading the original file. */
export async function extractTextFromFile(file) {
  if (!file) throw new Error('No file provided');

  const extension = file.name.split('.').pop().toLowerCase();

  if (extension === 'pdf') {
    const pdfjs = await import('pdfjs-dist');
    const { default: workerUrl } = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
    const loadingTask = pdfjs.getDocument({ data: await file.arrayBuffer() });
    try {
      const pdf = await loadingTask.promise;
      const pages = [];
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
        const page = await pdf.getPage(pageNumber);
        const content = await page.getTextContent();
        pages.push(content.items.map(item => item.str + (item.hasEOL ? '\n' : ' ')).join('').trim());
      }
      const text = pages.join('\n\n').trim();
      if (!text) throw new Error('PDF does not contain selectable text.');
      return text;
    } finally {
      await loadingTask.destroy();
    }
  }

  if (extension === 'md' || extension === 'markdown' || extension === 'txt' || extension === 'json') {
    return await file.text();
  }

  throw new Error(`Unsupported file type: .${extension}. Supported formats: PDF, MD, JSON, TXT`);
}
