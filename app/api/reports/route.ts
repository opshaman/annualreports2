// app/api/reports/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/app/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    
    const { data: reports, error } = await supabase
      .from('annual_reports')
      .select(`
        id,
        report_type,
        year,
        company_id,
        companies (
          company,
          industry
        )
      `)
      .order('year', { ascending: false })

    if (error) {
      console.error('Reports fetch error:', error)
      throw error
    }

    return NextResponse.json({
      success: true,
      reports: reports || []
    })

  } catch (error) {
    console.error('Reports fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    )
  }
}