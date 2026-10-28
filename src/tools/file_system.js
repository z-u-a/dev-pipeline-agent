import fs from 'fs';
import path from 'path';
import { PDFParse } from 'pdf-parse';
const ALLOWED_READ = [path.resolve('./resume1.txt'), path.resolve('./output/portfolio_blueprint.md')];
const ALLOWED_WRITE = [path.resolve('./output/portfolio_blueprint.md')];

export const declarations = [
  {
    name: 'readFile',
    description: 'Reads the raw text content of a local file path (like a resume.txt).',
    parameters: {
      type: 'OBJECT',
      properties: { filePath: { type: 'STRING', description: 'The local path of the file to read.' } },
      required: ['filePath']
    }
  },
  {
    name: 'writeFile',
    description: 'Writes the structured markdown blueprint contract to the local file path.',
    parameters: {
      type: 'OBJECT',
      properties: {
        filePath: { type: 'STRING', description: 'The local path where the blueprint should be saved.' },
        content: { type: 'STRING', description: 'The complete string content of the markdown layout blueprint.' }
      },
      required: ['filePath', 'content']
    }
  }
];

/**
 * Tool: Safely reads the contents of a local file.
 */
export function readFile({ filePath }) {
  try {
    const resolvedPath = path.resolve(filePath);

    if (!ALLOWED_READ.includes(resolvedPath)) {
      return { error: 'Access denied: path not allowed.' };
    }

    if (!fs.existsSync(resolvedPath)) {
      return { error: `File not found at: ${filePath}` };
    }
    const content = fs.readFileSync(resolvedPath, 'utf-8');
    return { content };
  } catch (error) {
    return { error: `Read error: ${error.message}` };
  }
}

/**
 * Tool: Writes content to a specific file pathway.
 */
export function writeFile({ filePath, content }) {
  try {
    const resolvedPath = path.resolve(filePath);
    
    if (!ALLOWED_WRITE.includes(resolvedPath)) {
      return { error: 'Access denied: path not allowed.' };
    }
    const dir = path.dirname(resolvedPath);

    // Create directories if they don't exist
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(resolvedPath, content, 'utf-8');
    const stats = fs.statSync(resolvedPath);
    const sizeKB = (stats.size / 1024).toFixed(2);

    // Production Pattern: Return lightweight metadata, not the whole file content
    return { result: `Success: Wrote file to ${filePath} (${sizeKB} KB)` };
  } catch (error) {
    return { error: `Write error: ${error.message}` };
  }
}


export async function parseResumeFile(filePath) {
  try {
    const resolvedPath = path.resolve(filePath);
    if (!fs.existsSync(resolvedPath)) {
      return { error: `File not found at: ${filePath}` };
    }

    const extension = path.extname(resolvedPath).toLowerCase();

    // 1. If it's a standard text file, read it natively
    if (extension === '.txt' || extension === '.md') {
      const content = fs.readFileSync(resolvedPath, 'utf-8');
      return { content };
    }

    // 2. If it's a PDF, read it as a binary buffer and parse out the layout text
    if (extension === '.pdf') {
      console.log("[Parser]: Extracting raw metadata text from PDF structure...");
      const dataBuffer = fs.readFileSync(resolvedPath);
      const parser = new PDFParse({ url: resolvedPath });
      const result = await parser.getText();
      await parser.destroy();
      return result.text;
    }

    return { error: `Unsupported file format: '${extension}'. Please use .txt, .md, or .pdf.` };
  } catch (error) {
    return { error: `Extraction engine failure: ${error.message}` };
  }
}