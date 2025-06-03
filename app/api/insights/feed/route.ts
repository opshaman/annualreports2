// app/api/insights/feed/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/app/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // For now, we'll get all insights without user-specific filtering
    // Later you can add user authentication and personalization
    const { data: insights, error } = await supabase
      .from('ai_insights')
      .select(`
        *,
        annual_reports!inner (
          report_type,
          year,
          companies!inner (
            company,
            industry,
            sector
          )
        )
      `)
      .eq('processing_status', 'completed')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw error
    }

    // Check if there are more items
    const { count } = await supabase
      .from('ai_insights')
      .select('*', { count: 'exact', head: true })
      .eq('processing_status', 'completed')

    const hasMore = (count || 0) > offset + limit

    return NextResponse.json({
      success: true,
      insights: insights || [],
      hasMore,
      total: count || 0,
      offset,
      limit
    })

  } catch (error) {
    console.error('Feed error:', error)
    return NextResponse.json(
      { error: 'Failed to get feed' },
      { status: 500 }
    )
  }
}