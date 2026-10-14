// src/tools/fileSystem.js
import fs from 'fs';
import path from 'path';

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
