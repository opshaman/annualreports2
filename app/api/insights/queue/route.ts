// app/api/insights/queue/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/app/lib/supabase'
import { aiInsightsService } from '@/lib/services/aiInsightsService'

// POST - Queue insights for background processing
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    
    const body = await request.json()
    const { reportId, insightTypes, priority = 0 } = body

    if (!reportId || !insightTypes || !Array.isArray(insightTypes)) {
      return NextResponse.json({ error: 'Missing required fields: reportId and insightTypes' }, { status: 400 })
    }

    // Verify report exists
    const { data: report, error: reportError } = await supabase
      .from('annual_reports')
      .select('id, company_id')
      .eq('id', reportId)
      .single()

    if (reportError || !report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    // Queue for background processing
    await aiInsightsService.queueInsightsGeneration(reportId, insightTypes, priority)

    return NextResponse.json({
      success: true,
      message: 'Insights queued for processing',
      reportId,
      insightTypes,
      priority
    })

  } catch (error) {
    console.error('Queue error:', error)
    return NextResponse.json(
      { error: 'Failed to queue insights' },
      { status: 500 }
    )
  }
}

// GET - Get queue status and items
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    
    // Get basic queue stats first
    const { data: queueItems, error } = await supabase
      .from('insight_processing_queue')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Queue fetch error:', error)
      return NextResponse.json({
        success: true,
        stats: {
          pending: 0,
          processing: 0,
          completed: 0,
          failed: 0
        },
        items: []
      })
    }

    // Calculate stats
    const pending = queueItems?.filter(item => !item.started_at) || []
    const processing = queueItems?.filter(item => item.started_at && !item.completed_at) || []
    const completed = queueItems?.filter(item => item.completed_at) || []
    const failed = queueItems?.filter(item => item.retry_count >= item.max_retries) || []

    // For each queue item, try to get the report info separately
    const itemsWithReports = []
    
    for (const item of queueItems || []) {
      try {
        const { data: reportData } = await supabase
          .from('annual_reports')
          .select(`
            report_type,
            companies (company)
          `)
          .eq('id', item.annual_report_id)
          .single()

        itemsWithReports.push({
          ...item,
          annual_reports: reportData ? {
            report_type: reportData.report_type,
            companies: reportData.companies
          } : {
            report_type: 'Unknown',
            companies: { company: 'Unknown Company' }
          }
        })
      } catch (reportError) {
        // If we can't get report info, add a placeholder
        itemsWithReports.push({
          ...item,
          annual_reports: {
            report_type: 'Unknown',
            companies: { company: 'Unknown Company' }
          }
        })
      }
    }

    return NextResponse.json({
      success: true,
      stats: {
        pending: pending.length,
        processing: processing.length,
        completed: completed.length,
        failed: failed.length
      },
      items: itemsWithReports
    })

  } catch (error) {
    console.error('Queue status error:', error)
    return NextResponse.json(
      { error: 'Failed to get queue status' },
      { status: 500 }
    )
  }
}