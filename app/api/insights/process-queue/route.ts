// app/api/insights/process-queue/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { aiInsightsService } from '@/lib/services/aiInsightsService'

export async function POST(request: NextRequest) {
  try {
    // Security check for cron jobs
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.CRON_SECRET || 'development-secret'
    
    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const batchSize = parseInt(searchParams.get('batchSize') || '3')

    console.log(`Processing insights queue with batch size: ${batchSize}`)

    // Process queue
    const result = await aiInsightsService.processQueue(batchSize)

    console.log(`Queue processing completed:`, result)

    return NextResponse.json({
      success: true,
      processed: result.processed,
      successful: result.successful,
      failed: result.failed,
      results: result.results
    })

  } catch (error) {
    console.error('Queue processing error:', error)
    return NextResponse.json(
      { error: 'Failed to process queue' },
      { status: 500 }
    )
  }
}