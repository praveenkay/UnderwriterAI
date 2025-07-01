import ExcelJS from 'exceljs';
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
      
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);
      let allText = '';
      
      // Process each worksheet
      for (const worksheet of workbook.worksheets) {
        console.log(`Processing sheet: ${worksheet.name}`);
        
        // Extract text from all cells
        worksheet.eachRow((row, rowNumber) => {
          const rowValues: string[] = [];
          
          row.eachCell((cell, colNumber) => {
            if (cell.value !== null && cell.value !== undefined) {
              let cellText = '';
              
              // Handle different cell value types
              if (typeof cell.value === 'string') {
                cellText = cell.value;
              } else if (typeof cell.value === 'number') {
                cellText = cell.value.toString();
              } else if (cell.value instanceof Date) {
                cellText = cell.value.toISOString();
              } else if (typeof cell.value === 'object' && 'text' in cell.value && cell.value.text) {
                // Rich text
                cellText = cell.value.text;
              } else {
                cellText = String(cell.value);
              }
              
              if (cellText.trim().length > 0) {
                rowValues.push(cellText.trim());
              }
            }
          });
          
          if (rowValues.length > 0) {
            allText += rowValues.join(' | ') + '\n';
          }
        });
        
        allText += `\n--- End of Sheet: ${worksheet.name} ---\n\n`;
      }
      
      console.log(`Extracted ${allText.length} characters from Excel file`);
      return allText.trim();
      
    } catch (error) {
      console.error('Error processing Excel file:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to process Excel file: ${errorMessage}`);
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