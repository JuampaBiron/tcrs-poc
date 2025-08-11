import { NextRequest, NextResponse } from 'next/server'
import { getRequestStats, getRequestStatsByUser, getRequestStatsByApprover } from '@/db/queries'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role') as 'requester' | 'approver' | 'admin'
    const email = searchParams.get('email')

    if (!role || !email) {
      return NextResponse.json({ error: 'Missing role or email' }, { status: 400 })
    }

    let stats
    
    switch (role) {
      case 'requester':
        stats = await getRequestStatsByUser(email)
        break
      case 'approver':
        stats = await getRequestStatsByApprover(email)
        break
      case 'admin':
        stats = await getRequestStats()
        break
      default:
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    return NextResponse.json({ stats })

  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json({ 
      stats: { total: 0, pending: 0, approved: 0, rejected: 0 } 
    })
  }
}