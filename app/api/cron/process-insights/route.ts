// app/api/cron/process-insights/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.CRON_SECRET || 'development-secret'
    
    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Call the processing endpoint
    const processUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/insights/process-queue`
    
    const response = await fetch(processUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${expectedToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Processing failed: ${response.statusText}`)
    }

    const result = await response.json()
    
    console.log('Cron job completed:', result)
    
    return NextResponse.json({
      success: true,
      message: 'Cron job completed successfully',
      result
    })

  } catch (error) {
    console.error('Cron job failed:', error)
    return NextResponse.json(
      { error: 'Cron job failed' },
      { status: 500 }
    )
  }
}