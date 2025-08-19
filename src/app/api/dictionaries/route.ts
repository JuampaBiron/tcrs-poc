// src/app/api/dictionaries/route.ts
import { NextResponse } from 'next/server';
import { getAvailableCompanies, getAvailableCurrencies } from '@/db/queries';
import { createSuccessResponse, createErrorResponse } from '@/lib/error-handler';
import { DICTIONARY_FALLBACKS } from '@/constants';

export async function GET() {
  try {
    console.log('📚 Fetching all dictionaries...')
    
    // Fetch companies from database
    let companies: { code: string; description: string; }[] = [...DICTIONARY_FALLBACKS.companies];
    try {
      companies = await getAvailableCompanies();
      console.log(`✅ Loaded ${companies.length} companies from DB`);
    } catch (error) {
      console.error('❌ Error loading companies, using fallback:', error);
    }

    // Get currencies (static for now)
    const currencies = await getAvailableCurrencies();

    const dictionaries = {
      companies,
      branches: [], // Branches are now loaded dynamically based on company
      currencies,
    };

    return createSuccessResponse(dictionaries);
  } catch (error) {
    console.error('❌ Error fetching dictionaries:', error);
    
    // Return fallback data if everything fails
    return createSuccessResponse({
      companies: [...DICTIONARY_FALLBACKS.companies],
      branches: [],
      currencies: [...DICTIONARY_FALLBACKS.currencies],
    });
  }
}