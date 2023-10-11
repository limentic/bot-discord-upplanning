import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';

export const saveToFile = (filePath: string, content: string): void => {
  if (!existsSync(filePath)) {
    // Create the parent directory if it doesn't exist
    const directory = filePath.split('/').slice(0, -1).join('/');
    if (!existsSync(directory)) {
      mkdirSync(directory, { recursive: true });
    }
  }

  // Save the content to the file
  writeFileSync(filePath, content);
};

export const readFromFile = (filePath: string): string | null => {
  try {
    return readFileSync(filePath, 'utf-8');
  } catch (error) {
    return null;
  }
};
