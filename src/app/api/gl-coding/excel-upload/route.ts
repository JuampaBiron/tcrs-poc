// src/app/api/gl-coding/excel-upload/route.ts (versión simplificada)
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('🚀 API endpoint hit!');
  
  try {
    const formData = await request.formData();
    console.log('📄 FormData received');
    
    const file = formData.get('file') as File;
    console.log('📁 File:', file?.name, file?.size);
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Simple response first
    return NextResponse.json({
      success: true,
      message: 'File received successfully',
      fileName: file.name,
      fileSize: file.size,
      preview: [], // Empty for now
      validationErrors: [],
      totalEntries: 0,
      totalAmount: 0
    });

  } catch (error) {
    console.error('❌ API Error:', error);
    return NextResponse.json(
      { error: 'Server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}