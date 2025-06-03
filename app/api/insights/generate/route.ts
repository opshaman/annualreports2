// app/api/insights/generate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/app/lib/supabase'
import { aiInsightsService, InsightType } from '@/lib/services/aiInsightsService'

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    
    // Get request body
    const body = await request.json()
    const { reportId, insightTypes, priority = 0 } = body

    if (!reportId || !insightTypes || !Array.isArray(insightTypes)) {
      return NextResponse.json({ error: 'Missing required fields: reportId and insightTypes' }, { status: 400 })
    }

    // Verify report exists
    const { data: report, error: reportError } = await supabase
      .from('annual_reports')
      .select('id, company_id, report_type')
      .eq('id', reportId)
      .single()

    if (reportError || !report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    console.log(`Starting insights generation for report ${reportId}`)

    // Generate insights
    const results = await aiInsightsService.generateInsightsForReport(reportId, insightTypes)

    return NextResponse.json({
      success: true,
      reportId,
      results,
      totalGenerated: results.filter(r => r.success).length,
      totalFailed: results.filter(r => !r.success).length
    })

  } catch (error) {
    console.error('Insights generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate insights' },
      { status: 500 }
    )
  }
}