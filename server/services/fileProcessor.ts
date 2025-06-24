import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Enhanced file processor for handling large Excel files and other formats
 */
export class FileProcessor {
  
  /**
   * Process Excel files and extract text content
   */
  static async processExcelFile(filePath: string): Promise<string> {
    try {
      console.log(`Processing Excel file: ${filePath}`);
      
      const workbook = XLSX.readFile(filePath);
      let allText = '';
      
      // Process each worksheet
      for (const sheetName of workbook.SheetNames) {
        console.log(`Processing sheet: ${sheetName}`);
        
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON to extract all cell values
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1, 
          defval: '',
          raw: false // Get formatted values
        });
        
        // Extract text from all cells
        for (const row of jsonData) {
          if (Array.isArray(row)) {
            const rowText = row
              .filter(cell => cell && typeof cell === 'string' && cell.trim().length > 0)
              .join(' | ');
            
            if (rowText.trim()) {
              allText += rowText + '\n';
            }
          }
        }
        
        allText += `\n--- End of Sheet: ${sheetName} ---\n\n`;
      }
      
      console.log(`Extracted ${allText.length} characters from Excel file`);
      return allText.trim();
      
    } catch (error) {
      console.error('Error processing Excel file:', error);
      throw new Error(`Failed to process Excel file: ${error.message}`);
    }
  }
  
  /**
   * Process any file and return text content
   */
  static async processFile(filePath: string, mimeType: string): Promise<string> {
    const ext = path.extname(filePath).toLowerCase();
    
    switch (ext) {
      case '.xlsx':
      case '.xls':
        return await this.processExcelFile(filePath);
        
      case '.txt':
      case '.csv':
        return fs.readFileSync(filePath, 'utf-8');
        
      case '.json':
        const jsonContent = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        return JSON.stringify(jsonContent, null, 2);
        
      default:
        // Try reading as text
        try {
          return fs.readFileSync(filePath, 'utf-8');
        } catch (error) {
          throw new Error(`Unsupported file type: ${ext}`);
        }
    }
  }
  
  /**
   * Validate file size and type
   */
  static validateFile(filePath: string, maxSizeBytes: number = 50 * 1024 * 1024): boolean {
    const stats = fs.statSync(filePath);
    
    if (stats.size > maxSizeBytes) {
      throw new Error(`File too large: ${Math.round(stats.size / 1024 / 1024)}MB (max: ${Math.round(maxSizeBytes / 1024 / 1024)}MB)`);
    }
    
    return true;
  }
}