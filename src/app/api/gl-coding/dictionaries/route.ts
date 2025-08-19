// src/app/api/gl-coding/dictionaries/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { accountsMaster, facility } from '@/db/schema';
import { ilike, or } from 'drizzle-orm';

// GET /api/gl-coding/dictionaries - Obtener todos los diccionarios
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    // Get accounts with search filter
    let accounts;
    if (search) {
      accounts = await db
        .select()
        .from(accountsMaster)
        .where(
          or(
            ilike(accountsMaster.accountCode, `%${search}%`),
            ilike(accountsMaster.accountDescription, `%${search}%`)
          )
        )
        .orderBy(accountsMaster.accountCode);
    } else {
      accounts = await db
        .select()
        .from(accountsMaster)
        .orderBy(accountsMaster.accountCode);
    }

    // Get facilities with search filter
    let facilities;
    if (search) {
      facilities = await db
        .select()
        .from(facility)
        .where(
          or(
            ilike(facility.facilityCode, `%${search}%`),
            ilike(facility.facilityDescription, `%${search}%`)
          )
        )
        .orderBy(facility.facilityCode);
    } else {
      facilities = await db
        .select()
        .from(facility)
        .orderBy(facility.facilityCode);
    }

    // Tax codes (actual codes used in system)
    const taxCodes = [
      { code: '000', description: '000' },
      { code: '900', description: '900' }
    ].filter(tax => 
      !search || 
      tax.code.toLowerCase().includes(search.toLowerCase())
    );

    return NextResponse.json({
      accounts: accounts.map((acc: any) => ({
        accountCode: acc.accountCode,
        accountDescription: acc.accountDescription,
        accountCombined: `${acc.accountCode} - ${acc.accountDescription}`
      })),
      facilities: facilities.map((fac: any) => ({
        facilityCode: fac.facilityCode,
        facilityDescription: fac.facilityDescription,
        facilityCombined: `${fac.facilityCode} - ${fac.facilityDescription}`
      })),
      taxCodes
    });

  } catch (error) {
    console.error('Error fetching dictionaries:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}