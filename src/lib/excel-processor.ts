// src/lib/excel-processor.ts
// Utility functions for Excel processing
import ExcelJS from 'exceljs';

export interface ExcelProcessingResult {
  entries: GLCodingEntry[];
  errors: string[];
  warnings: string[];
  metadata: {
    fileName: string;
    fileSize: number;
    totalEntries: number;
    totalAmount: number;
  };
}

export interface GLCodingEntry {
  accountCode: string;
  facilityCode: string;
  taxCode: string;
  amount: number;
  equipment: string;
  comments: string;
}

export class ExcelProcessor {
  
  static async processFile(file: File): Promise<ExcelProcessingResult> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);
      
      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        throw new Error('Excel file contains no worksheets');
      }

      const entries: GLCodingEntry[] = [];
      const errors: string[] = [];
      const warnings: string[] = [];

      // Process each row starting from row 2 (skip header)
      worksheet.eachRow((row: ExcelJS.Row, rowNumber: number) => {
        if (rowNumber === 1) return; // Skip header row
        
        const rowNum = rowNumber - 1; // Adjust for display (since we skip header)
        
        // Parse new 9-column format
        const line = row.getCell(1).text?.trim() || '';
        const accountCode = row.getCell(2).text?.trim() || '';
        const accountDescription = row.getCell(3).text?.trim() || '';
        const facilityCode = row.getCell(4).text?.trim() || '';
        const facilityDescription = row.getCell(5).text?.trim() || '';
        const taxCode = row.getCell(6).text?.trim() || '';
        const amount = this.parseAmount(row.getCell(7).value);
        const equipment = row.getCell(8).text?.trim() || '';
        const comments = row.getCell(9).text?.trim() || '';
        
        // Skip completely empty rows
        if (!accountCode && !facilityCode && !amount) {
          return;
        }

        const entry: GLCodingEntry = {
          accountCode,
          facilityCode,
          taxCode,
          amount,
          equipment,
          comments
        };

        // Basic validation only (no dictionary validation)
        if (!entry.accountCode) {
          errors.push(`Row ${rowNum}: Account Code is required`);
        }
        if (!entry.facilityCode) {
          errors.push(`Row ${rowNum}: Facility Code is required`);
        }
        if (entry.amount <= 0) {
          errors.push(`Row ${rowNum}: Amount must be greater than 0`);
        }

        // Warnings for optional fields
        if (!entry.taxCode) {
          warnings.push(`Row ${rowNum}: Tax Code is empty`);
        }

        entries.push(entry);
      });

      const totalAmount = entries.reduce((sum, entry) => sum + entry.amount, 0);

      return {
        entries,
        errors,
        warnings,
        metadata: {
          fileName: file.name,
          fileSize: file.size,
          totalEntries: entries.length,
          totalAmount
        }
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to process Excel file: ${errorMessage}`);
    }
  }

  private static parseAmount(value: any): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      // Remove currency symbols and commas
      const cleaned = value.replace(/[$,]/g, '');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    }
    // Handle ExcelJS cell values (formulas, etc.)
    if (value && typeof value === 'object') {
      if ('result' in value) {
        return this.parseAmount(value.result);
      }
      if ('value' in value) {
        return this.parseAmount(value.value);
      }
    }
    return 0;
  }

  // Removed validateAgainstDictionaries - no longer needed
  // Excel data is accepted as-is without dictionary validation

  static generateSummary(entries: GLCodingEntry[]) {
    const summary = {
      totalEntries: entries.length,
      totalAmount: entries.reduce((sum, entry) => sum + entry.amount, 0),
      byAccount: {} as Record<string, { count: number; amount: number }>,
      byFacility: {} as Record<string, { count: number; amount: number }>,
      averageAmount: 0,
      largestEntry: 0,
      smallestEntry: Infinity
    };

    entries.forEach(entry => {
      // By account
      if (!summary.byAccount[entry.accountCode]) {
        summary.byAccount[entry.accountCode] = { count: 0, amount: 0 };
      }
      summary.byAccount[entry.accountCode].count++;
      summary.byAccount[entry.accountCode].amount += entry.amount;

      // By facility
      if (!summary.byFacility[entry.facilityCode]) {
        summary.byFacility[entry.facilityCode] = { count: 0, amount: 0 };
      }
      summary.byFacility[entry.facilityCode].count++;
      summary.byFacility[entry.facilityCode].amount += entry.amount;

      // Min/max
      summary.largestEntry = Math.max(summary.largestEntry, entry.amount);
      summary.smallestEntry = Math.min(summary.smallestEntry, entry.amount);
    });

    summary.averageAmount = summary.totalAmount / summary.totalEntries;
    
    return summary;
  }
}

export default ExcelProcessor;