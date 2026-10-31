/**
 * Client-side text extractor for CV files.
 * Supports: Markdown (.md), JSON (.json), and Plain Text (.txt).
 * PDF and DOCX formats are not used; CVs are provided directly in MD, JSON, or TXT.
 * All processing is strictly performed in-browser using local web APIs.
 */

export async function extractTextFromFile(file) {
  if (!file) throw new Error('No file provided');

  const extension = file.name.split('.').pop().toLowerCase();

  if (extension === 'md' || extension === 'markdown' || extension === 'txt' || extension === 'json') {
    return await file.text();
  }

  throw new Error(`Unsupported file type: .${extension}. Supported formats: MD, JSON, TXT`);
}
