// app/api/insights/engagement/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/app/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    
    const body = await request.json()
    const { insightId, action, durationSeconds, userId } = body

    if (!insightId || !action) {
      return NextResponse.json({ error: 'Missing required fields: insightId and action' }, { status: 400 })
    }

    // For now, we'll use a placeholder user ID
    // Later, you can get this from user authentication
    const finalUserId = userId || '00000000-0000-0000-0000-000000000000'

    // Record engagement
    const { error } = await supabase
      .from('insight_engagements')
      .upsert({
        user_id: finalUserId,
        insight_id: insightId,
        action,
        duration_seconds: durationSeconds
      })

    if (error) {
      console.error('Engagement error:', error)
      // Don't fail the request if engagement tracking fails
    }

    return NextResponse.json({
      success: true,
      message: 'Engagement recorded'
    })

  } catch (error) {
    console.error('Engagement error:', error)
    return NextResponse.json(
      { error: 'Failed to record engagement' },
      { status: 500 }
    )
  }
}