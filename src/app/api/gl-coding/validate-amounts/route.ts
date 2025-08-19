// src/app/api/gl-coding/validate-amounts/route.ts
import { NextRequest, NextResponse } from 'next/server';

// POST /api/gl-coding/validate-amounts - Validar que montos coincidan con invoice
export async function POST(request: NextRequest) {
  try {
    const { entries, invoiceAmount } = await request.json();

    if (!entries || !Array.isArray(entries) || typeof invoiceAmount !== 'number') {
      return NextResponse.json(
        { error: 'entries array and invoiceAmount are required' },
        { status: 400 }
      );
    }

    const totalAmount = entries.reduce((sum: number, entry: any) => 
      sum + (parseFloat(entry.amount) || 0), 0
    );

    const difference = totalAmount - invoiceAmount;
    const isValid = Math.abs(difference) < 0.01; // Allow for floating point precision

    const validation = {
      isValid,
      totalAmount,
      invoiceAmount,
      difference,
      entryCount: entries.length,
      message: isValid 
        ? 'Amounts match correctly'
        : `Total GL amount ($${totalAmount.toFixed(2)}) does not match invoice amount ($${invoiceAmount.toFixed(2)})`
    };

    return NextResponse.json(validation);

  } catch (error) {
    console.error('Error validating amounts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}