import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/app/lib/supabase'

export async function GET() {
  try {
    const supabase = createAdminClient()

    // Get counts from ai_insights table using correct Supabase syntax
    const [completed, pending, failed, processing] = await Promise.all([
      supabase.from('ai_insights').select('*', { count: 'exact', head: true }).eq('processing_status', 'completed'),
      supabase.from('ai_insights').select('*', { count: 'exact', head: true }).eq('processing_status', 'pending'),
      supabase.from('ai_insights').select('*', { count: 'exact', head: true }).eq('processing_status', 'failed'),
      supabase.from('ai_insights').select('*', { count: 'exact', head: true }).eq('processing_status', 'processing')
    ])

    const stats = {
      pending: pending.count || 0,
      processing: processing.count || 0,
      completed: completed.count || 0,
      failed: failed.count || 0
    }

    // Get recent queue items for the table display
    const { data: items, error: itemsError } = await supabase
      .from('ai_insights')
      .select(`
        id,
        annual_report_id,
        insight_type,
        processing_status,
        created_at,
        updated_at,
        error_message,
        annual_reports!inner (
          title,
          companies!inner (
            name
          )
        )
      `)
      .order('created_at', { ascending: false })
      .limit(50)

    if (itemsError) {
      console.error('Error fetching queue items:', itemsError)
    }

    // Transform the data to match the expected format
    const transformedItems = (items || []).map((item: any) => ({
      id: item.id,
      annual_report_id: item.annual_report_id,
      insight_types: [item.insight_type], // Convert single type to array for compatibility
      priority: 0, // Default priority since not stored in ai_insights
      retry_count: 0, // Default since not tracked in ai_insights
      max_retries: 3, // Default max retries
      scheduled_for: item.created_at,
      started_at: item.processing_status === 'processing' ? item.updated_at : null,
      completed_at: item.processing_status === 'completed' ? item.updated_at : null,
      error_message: item.error_message,
      created_at: item.created_at,
      annual_reports: {
        title: item.annual_reports.title,
        companies: {
          name: item.annual_reports.companies.name
        }
      }
    }))

    return NextResponse.json({
      success: true,
      stats,
      items: transformedItems
    })

  } catch (error) {
    console.error('Error fetching queue data:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch queue data',
        stats: { pending: 0, processing: 0, completed: 0, failed: 0 },
        items: []
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { reportId, insightTypes, priority = 0 } = body

    if (!reportId || !insightTypes || !Array.isArray(insightTypes)) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: reportId, insightTypes' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Instead of creating queue items, we'll create pending insights directly
    const insertData = insightTypes.map(type => ({
      annual_report_id: reportId,
      insight_type: type,
      processing_status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }))

    const { data, error } = await supabase
      .from('ai_insights')
      .insert(insertData)
      .select()

    if (error) {
      console.error('Error creating queue items:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to queue insights' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Queued ${insightTypes.length} insights for processing`,
      queuedItems: data
    })

  } catch (error) {
    console.error('Error in POST /api/insights/queue:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}