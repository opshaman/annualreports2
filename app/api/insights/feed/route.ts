// app/api/insights/feed/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createServerSupabaseClient } from '@/app/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const adminSupabase = createAdminClient()
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Try to get user preferences for personalization
    let userInterests: string[] = []
    try {
      const userSupabase = await createServerSupabaseClient()
      const { data: { user } } = await userSupabase.auth.getUser()
      
      if (user) {
        const { data: profile } = await userSupabase
          .from('user_profiles')
          .select('interests')
          .eq('id', user.id)
          .single()
        
        userInterests = profile?.interests || []
      }
    } catch (error) {
      // Continue without personalization if user auth fails
      console.log('No user auth available, showing general feed')
    }

    let query = adminSupabase
      .from('ai_insights')
      .select(`
        *,
        annual_reports!inner (
          report_type,
          year,
          companies!inner (
            company,
            industry,
            sector,
            ticker_symbol
          )
        )
      `)
      .eq('processing_status', 'completed')

    // Apply interest-based filtering if user has interests
    if (userInterests.length > 0) {
      // Create OR conditions for different interest types
      const insightTypeFilters = userInterests.filter(interest => 
        ['financial_analysis', 'risk_assessment', 'business_insights', 'entrepreneurial_recommendations'].includes(interest)
      )
      
      const industryFilters = userInterests.filter(interest => 
        !['financial_analysis', 'risk_assessment', 'business_insights', 'entrepreneurial_recommendations'].includes(interest)
      )

      // Build filter conditions
      const conditions = []
      
      if (insightTypeFilters.length > 0) {
        conditions.push(`insight_type.in.(${insightTypeFilters.join(',')})`)
      }
      
      if (industryFilters.length > 0) {
        conditions.push(`annual_reports.companies.industry.in.(${industryFilters.join(',')})`)
      }

      // Apply OR filter if we have any conditions
      if (conditions.length > 0) {
        query = query.or(conditions.join(','))
      }
    }

    const { data: insights, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw error
    }

    // Check if there are more items (with same filtering)
    let countQuery = adminSupabase
      .from('ai_insights')
      .select('*', { count: 'exact', head: true })
      .eq('processing_status', 'completed')

    // Apply same filtering for count
    if (userInterests.length > 0) {
      const insightTypeFilters = userInterests.filter(interest => 
        ['financial_analysis', 'risk_assessment', 'business_insights', 'entrepreneurial_recommendations'].includes(interest)
      )
      
      const industryFilters = userInterests.filter(interest => 
        !['financial_analysis', 'risk_assessment', 'business_insights', 'entrepreneurial_recommendations'].includes(interest)
      )

      const conditions = []
      
      if (insightTypeFilters.length > 0) {
        conditions.push(`insight_type.in.(${insightTypeFilters.join(',')})`)
      }
      
      if (industryFilters.length > 0) {
        countQuery = adminSupabase
          .from('ai_insights')
          .select(`
            *,
            annual_reports!inner (
              companies!inner (
                industry
              )
            )
          `, { count: 'exact', head: true })
          .eq('processing_status', 'completed')
        conditions.push(`annual_reports.companies.industry.in.(${industryFilters.join(',')})`)
      }

      if (conditions.length > 0) {
        countQuery = countQuery.or(conditions.join(','))
      }
    }

    const { count } = await countQuery
    const hasMore = (count || 0) > offset + limit

    return NextResponse.json({
      success: true,
      insights: insights || [],
      hasMore,
      total: count || 0,
      offset,
      limit,
      personalized: userInterests.length > 0,
      userInterests
    })

  } catch (error) {
    console.error('Feed error:', error)
    return NextResponse.json(
      { error: 'Failed to get feed' },
      { status: 500 }
    )
  }
}