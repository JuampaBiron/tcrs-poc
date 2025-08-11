import { NextRequest, NextResponse } from 'next/server'
import { getRequestsByUser, getRequestsByApprover, getAllRequests } from '@/db/queries'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role') as 'requester' | 'approver' | 'admin'
    const email = searchParams.get('email')

    if (!role || !email) {
      return NextResponse.json({ error: 'Missing role or email' }, { status: 400 })
    }

    let requests
    
    switch (role) {
      case 'requester':
        requests = await getRequestsByUser(email)
        break
      case 'approver':
        requests = await getRequestsByApprover(email)
        break
      case 'admin':
        requests = await getAllRequests()
        break
      default:
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Transform data for frontend
    const transformedRequests = requests.map(req => ({
      id: req.requestId,
      title: req.comments || 'No description',
      status: req.approverStatus || 'pending',
      reviewer: req.assignedApprover || 'Unassigned',
      requester: req.requester || 'Unknown',
      submittedOn: req.createdDate ? new Date(req.createdDate).toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit', 
        year: '2-digit'
      }) : 'Unknown',
      branch: extractBranch(req.comments || ''),
      amount: extractAmount(req.comments || '')
    }))

    return NextResponse.json({ requests: transformedRequests })

  } catch (error) {
    console.error('Error fetching requests:', error)
    return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 })
  }
}

// Helper functions to extract data from comments
function extractBranch(comments: string): string {
  const branchMatch = comments.match(/(TCRS - Branch \d+|Sitech|Fused-[A-Za-z]+)/i)
  return branchMatch ? branchMatch[1] : 'Unknown Branch'
}

function extractAmount(comments: string): string {
  const amountMatch = comments.match(/\$[\d,]+(?:\.\d{2})?/i)
  return amountMatch ? amountMatch[0] : '$0'
}