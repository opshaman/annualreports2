// lib/services/aiInsightsService.ts
import { createAdminClient } from '@/app/lib/supabase'
import { pdfExtractionService, chunkTextForAI } from './pdfExtractionService'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export type InsightType = 
  | 'financial_analysis'
  | 'risk_assessment'
  | 'business_insights'
  | 'entrepreneurial_recommendations'
  | 'executive_summary'
  | 'market_analysis'
  | 'competitive_analysis'
  | 'esg_analysis'

export interface InsightGenerationResult {
  success: boolean
  insightId?: string
  error?: string
  tokensUsed?: number
  processingTimeMs?: number
}

export interface GeneratedInsight {
  title: string
  content: string
  summary: string
  keyMetrics?: Record<string, any>
  confidenceScore: number
}

export class AIInsightsService {
  private supabase = createAdminClient()

  /**
   * Generate all insights for a report
   */
  async generateInsightsForReport(
    reportId: string, 
    insightTypes: InsightType[] = ['financial_analysis', 'business_insights', 'executive_summary']
  ): Promise<InsightGenerationResult[]> {
    try {
      // Get or create PDF extraction
      let extraction = await pdfExtractionService.getExistingExtraction(reportId)
      if (!extraction || !extraction.success) {
        extraction = await pdfExtractionService.extractFromReport(reportId)
      }

      if (!extraction.success) {
        return [{ success: false, error: 'Failed to extract PDF content' }]
      }

      // Generate insights for each type
      const results: InsightGenerationResult[] = []
      for (const insightType of insightTypes) {
        const result = await this.generateSingleInsight(reportId, insightType, extraction.text)
        results.push(result)
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      return results
    } catch (error) {
      console.error('Failed to generate insights:', error)
      return [{ success: false, error: error instanceof Error ? error.message : 'Unknown error' }]
    }
  }

  /**
   * Generate a single insight
   */
  private async generateSingleInsight(
    reportId: string,
    insightType: InsightType,
    extractedText: string
  ): Promise<InsightGenerationResult> {
    const startTime = Date.now()

    try {
      // Get company context
      const { data: report } = await this.supabase
        .from('annual_reports')
        .select(`
          report_type,
          year,
          companies!inner (
            company,
            industry,
            sector
          )
        `)
        .eq('id', reportId)
        .single()

      const companyName = (report?.companies as any)?.company || 'Unknown Company'
      const industry = (report?.companies as any)?.industry || 'Unknown Industry'
      const year = report?.year || new Date().getFullYear()

      // Chunk the text if it's too large
      const textChunks = chunkTextForAI(extractedText, 12000)
      const textToAnalyze = textChunks.slice(0, 3).join('\n\n') // Use first 3 chunks

      // Generate the insight
      const prompt = this.buildPrompt(insightType, textToAnalyze, companyName, industry, year)
      
      const message = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        temperature: 0.7,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
      })

      const response = message.content[0]?.type === 'text' ? message.content[0].text : null
      if (!response) {
        throw new Error('No response from Claude')
      }

      // Parse the structured response
      const insight = this.parseAIResponse(response, insightType)
      
      // Store in database - FIXED: Changed from 'ai_insights' to 'insights'
      const { data: insertedInsight, error: insertError } = await this.supabase
        .from('ai_insights')
        .insert({
          annual_report_id: reportId,
          insight_type: insightType,
          title: insight.title,
          content: insight.content,
          summary: insight.summary,
          key_metrics: insight.keyMetrics || {},
          confidence_score: insight.confidenceScore,
          processing_status: 'completed',
          ai_model: 'claude-3-5-sonnet-20241022',
          tokens_used: message.usage.input_tokens + message.usage.output_tokens,
          processing_time_ms: Date.now() - startTime
        })
        .select('id')
        .single()

      if (insertError) {
        throw new Error(`Failed to store insight: ${insertError.message}`)
      }

      return {
        success: true,
        insightId: insertedInsight.id,
        tokensUsed: message.usage.input_tokens + message.usage.output_tokens,
        processingTimeMs: Date.now() - startTime
      }

    } catch (error) {
      console.error(`Failed to generate ${insightType} insight:`, error)
      
      // Store error in database - FIXED: Changed from 'ai_insights' to 'insights'
      await this.supabase
        .from('ai_insights')
        .insert({
          annual_report_id: reportId,
          insight_type: insightType,
          title: `Failed to generate ${insightType.replace('_', ' ')}`,
          content: 'Analysis failed due to processing error.',
          summary: 'Processing failed',
          processing_status: 'failed',
          processing_error: error instanceof Error ? error.message : 'Unknown error',
          ai_model: 'claude-3-5-sonnet-20241022',
          processing_time_ms: Date.now() - startTime
        })

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTimeMs: Date.now() - startTime
      }
    }
  }

  /**
   * Build prompt for specific insight type
   */
  private buildPrompt(
    insightType: InsightType,
    text: string,
    companyName: string,
    industry: string,
    year: number
  ): string {
    const baseContext = `I need you to analyze an annual report for ${companyName} (${industry} industry) from ${year}. Please provide a thorough analysis and respond in the specified JSON format.`
    
    const prompts = {
      financial_analysis: `${baseContext}

**Task:** Analyze the financial performance of this company based on their annual report.

**Focus Areas:**
- Revenue trends and growth rates
- Profitability metrics (margins, ROE, ROA)
- Balance sheet strength and liquidity
- Cash flow analysis
- Key financial ratios
- Year-over-year comparisons
- Financial outlook and guidance

**Required JSON Response Format:**
\`\`\`json
{
  "title": "Financial Performance Analysis",
  "content": "Detailed financial analysis (600-1000 words covering revenue growth, profitability, balance sheet strength, cash flows, and key financial ratios with specific numbers and percentages where available)",
  "summary": "2-3 sentence summary highlighting the most important financial insights",
  "keyMetrics": {
    "revenue_growth": "percentage or amount",
    "profit_margin": "percentage",
    "debt_to_equity": "ratio",
    "current_ratio": "ratio",
    "roe": "percentage",
    "total_revenue": "amount with currency"
  },
  "confidenceScore": 0.85
}
\`\`\`

**Annual Report Content:**
${text}`,

      business_insights: `${baseContext}

**Task:** Provide strategic business insights based on this annual report.

**Focus Areas:**
- Business model and strategic direction
- Market position and competitive advantages
- Operational efficiency and performance
- Management effectiveness and leadership
- Growth opportunities and expansion plans
- Strategic initiatives and major investments
- Innovation and technology adoption

**Required JSON Response Format:**
\`\`\`json
{
  "title": "Strategic Business Insights",
  "content": "Detailed strategic analysis (600-1000 words covering business strategy, competitive position, operational performance, and growth opportunities)",
  "summary": "2-3 sentence summary of key strategic insights",
  "keyMetrics": {
    "market_position": "description",
    "employee_count": "number",
    "geographic_reach": "description",
    "key_initiatives": "number or description"
  },
  "confidenceScore": 0.80
}
\`\`\`

**Annual Report Content:**
${text}`,

      executive_summary: `${baseContext}

**Task:** Create an executive summary of this annual report suitable for busy investors and stakeholders.

**Focus Areas:**
- Company overview and business highlights
- Financial performance summary
- Major achievements and milestones
- Key challenges and risks
- Future outlook and strategic direction
- Investment thesis and value proposition

**Required JSON Response Format:**
\`\`\`json
{
  "title": "Executive Summary",
  "content": "Comprehensive executive summary (500-800 words covering all key aspects an executive would need to know)",
  "summary": "Top 3 most important points for investors and stakeholders",
  "keyMetrics": {
    "total_revenue": "amount with currency",
    "net_income": "amount with currency",
    "employee_count": "number",
    "year_highlights": "brief description"
  },
  "confidenceScore": 0.90
}
\`\`\`

**Annual Report Content:**
${text}`,

      risk_assessment: `${baseContext}

**Task:** Assess the key risks facing this company based on their annual report.

**Focus Areas:**
- Market and industry-specific risks
- Operational and business risks
- Financial and credit risks
- Regulatory and compliance risks
- Strategic and competitive risks
- Risk mitigation strategies and controls
- Management's risk assessment

**Required JSON Response Format:**
\`\`\`json
{
  "title": "Risk Assessment",
  "content": "Detailed risk analysis (600-1000 words identifying, categorizing, and evaluating key risks with mitigation strategies)",
  "summary": "Top 3 most significant risks investors should monitor",
  "keyMetrics": {
    "overall_risk_level": "High/Medium/Low",
    "financial_risk": "High/Medium/Low",
    "operational_risk": "High/Medium/Low",
    "market_risk": "High/Medium/Low"
  },
  "confidenceScore": 0.75
}
\`\`\`

**Annual Report Content:**
${text}`,

      entrepreneurial_recommendations: `${baseContext}

**Task:** Provide entrepreneurial insights and actionable recommendations based on this annual report.

**Focus Areas:**
- Lessons for entrepreneurs and business builders
- Strategic decision-making insights
- Innovation and growth strategies
- Leadership and management lessons
- Market opportunity identification
- Operational excellence practices
- Scaling and expansion strategies

**Required JSON Response Format:**
\`\`\`json
{
  "title": "Entrepreneurial Insights & Recommendations",
  "content": "Detailed entrepreneurial analysis (600-1000 words with actionable insights and lessons for business leaders)",
  "summary": "Top 3 entrepreneurial lessons and recommendations",
  "keyMetrics": {
    "innovation_score": "rating 1-10",
    "growth_strategy": "description",
    "leadership_effectiveness": "rating 1-10",
    "scalability": "High/Medium/Low"
  },
  "confidenceScore": 0.80
}
\`\`\`

**Annual Report Content:**
${text}`,

      market_analysis: `${baseContext}

**Task:** Analyze the market context and competitive landscape based on this annual report.

**Focus Areas:**
- Market size, growth trends, and dynamics
- Competitive positioning and market share
- Industry trends and disruptions
- Customer segments and market penetration
- Pricing strategies and market positioning
- Emerging opportunities and threats

**Required JSON Response Format:**
\`\`\`json
{
  "title": "Market & Industry Analysis",
  "content": "Detailed market analysis (600-1000 words covering market dynamics, competitive landscape, and industry trends)",
  "summary": "Key market insights and competitive positioning",
  "keyMetrics": {
    "market_size": "estimated size",
    "market_growth_rate": "percentage",
    "market_share": "percentage or position",
    "competitive_advantage": "description"
  },
  "confidenceScore": 0.75
}
\`\`\`

**Annual Report Content:**
${text}`,

      competitive_analysis: `${baseContext}

**Task:** Analyze the competitive positioning and competitive strategy based on this annual report.

**Focus Areas:**
- Competitive advantages and differentiation
- Competitor analysis and benchmarking
- Competitive threats and market position
- Strategic responses to competition
- Competitive moats and barriers to entry
- Market share dynamics

**Required JSON Response Format:**
\`\`\`json
{
  "title": "Competitive Strategy Analysis",
  "content": "Detailed competitive analysis (600-1000 words covering competitive positioning, advantages, and strategic responses)",
  "summary": "Key competitive insights and strategic positioning",
  "keyMetrics": {
    "competitive_strength": "Strong/Medium/Weak",
    "market_position": "description",
    "differentiation": "High/Medium/Low",
    "competitive_moat": "description"
  },
  "confidenceScore": 0.80
}
\`\`\`

**Annual Report Content:**
${text}`,

      esg_analysis: `${baseContext}

**Task:** Analyze the ESG (Environmental, Social, Governance) performance and commitments based on this annual report.

**Focus Areas:**
- Environmental impact and sustainability initiatives
- Social responsibility and community engagement
- Governance structure and board effectiveness
- ESG risks and opportunities
- Sustainability goals and progress
- Stakeholder engagement and value creation

**Required JSON Response Format:**
\`\`\`json
{
  "title": "ESG Performance Analysis",
  "content": "Detailed ESG analysis (600-1000 words covering environmental, social, and governance aspects with specific initiatives and metrics)",
  "summary": "Key ESG highlights and sustainability commitments",
  "keyMetrics": {
    "esg_maturity": "Advanced/Developing/Basic",
    "sustainability_goals": "description",
    "governance_rating": "Strong/Medium/Weak",
    "social_impact": "description"
  },
  "confidenceScore": 0.70
}
\`\`\`

**Annual Report Content:**
${text}`
    }

    return prompts[insightType] || prompts.business_insights
  }

  /**
   * Parse AI response into structured insight - FIXED: Improved JSON parsing
   */
  private parseAIResponse(response: string, insightType: InsightType): GeneratedInsight {
    try {
      // Clean the response first
      let cleanResponse = response.trim()
      
      // Remove markdown code blocks if present
      const codeBlockMatch = cleanResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
      if (codeBlockMatch) {
        cleanResponse = codeBlockMatch[1].trim()
      }
      
      // Try to find JSON object boundaries
      const jsonStart = cleanResponse.indexOf('{')
      const jsonEnd = cleanResponse.lastIndexOf('}')
      
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        cleanResponse = cleanResponse.substring(jsonStart, jsonEnd + 1)
      }
      
      console.log('Original JSON before cleaning:', cleanResponse.substring(0, 200) + '...')
      
      // DON'T escape newlines - JSON.parse expects actual newlines in strings
      // Just clean up smart quotes and leave newlines as-is
      cleanResponse = cleanResponse
        .replace(/"/g, '"')              // Replace smart quotes
        .replace(/"/g, '"')              // Replace smart quotes
        .replace(/'/g, "'")              // Replace smart quotes
        .replace(/'/g, "'")              // Replace smart quotes
      
      console.log('Attempting to parse cleaned JSON (first 200 chars):', cleanResponse.substring(0, 200) + '...')
      
      const parsed = JSON.parse(cleanResponse)
      
      // Handle case where summary is an array
      let summaryText = parsed.summary
      if (Array.isArray(summaryText)) {
        summaryText = summaryText.join(' • ')
      }
      
      console.log('Successfully parsed JSON! Title:', parsed.title)
      
      return {
        title: parsed.title || `${insightType.replace('_', ' ')} Analysis`,
        content: parsed.content || response,
        summary: summaryText || 'AI-generated insights from Claude',
        keyMetrics: parsed.keyMetrics || {},
        confidenceScore: parsed.confidenceScore || 0.75
      }
      
    } catch (parseError) {
      console.error('JSON parsing failed:', parseError)
      console.log('Failed JSON (first 500 chars):', response.substring(0, 500))
      
      // Advanced fallback: try to extract fields manually using regex
      try {
        // More flexible regex that handles newlines
        const titleMatch = response.match(/"title":\s*"([^"]*)"/)
        const summaryMatch = response.match(/"summary":\s*"([^"]*(?:\\.[^"]*)*)"/)
        const confidenceMatch = response.match(/"confidenceScore":\s*([\d.]+)/)
        
        // For content, extract everything between "content": " and the next "
        const contentMatch = response.match(/"content":\s*"((?:[^"\\]|\\.)*)"/)
        
        if (titleMatch) {
          console.log('Using regex fallback, extracted title:', titleMatch[1])
          
          return {
            title: titleMatch[1] || `${insightType.replace('_', ' ')} Analysis`,
            content: contentMatch?.[1]?.replace(/\\n/g, '\n') || response.substring(0, 1000),
            summary: summaryMatch?.[1]?.replace(/\\n/g, '\n') || 'AI-generated insights from Claude',
            keyMetrics: {},
            confidenceScore: confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.70
          }
        }
      } catch (regexError) {
        console.error('Regex fallback failed:', regexError)
      }
      
      // Final fallback for completely unparseable responses
      console.log('Using final fallback parser')
      const lines = response.split('\n').filter(line => line.trim())
      const title = lines[0] || `${insightType.replace('_', ' ')} Analysis`
      const summary = lines.slice(0, 2).join(' ') || 'AI-generated insights from Claude'
      
      return {
        title: title.length > 100 ? `${insightType.replace('_', ' ')} Analysis` : title,
        content: response,
        summary: summary.length > 200 ? summary.substring(0, 200) + '...' : summary,
        keyMetrics: {},
        confidenceScore: 0.70
      }
    }
  }

  /**
   * Get insights for feed (TikTok-style)
   */
  async getInsightsForFeed(userId: string, limit: number = 20) {
    // Get user preferences
    const { data: preferences } = await this.supabase
      .from('user_feed_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()

    const preferredTypes = preferences?.preferred_insight_types || ['financial_analysis', 'business_insights']
    const preferredCompanies = preferences?.preferred_companies || []
    const preferredIndustries = preferences?.preferred_industries || []

    // Base query for insights
    let query = this.supabase
      .from('insights')
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
      .in('insight_type', preferredTypes)

    // Apply company filter if specified
    if (preferredCompanies.length > 0) {
      query = query.in('annual_reports.company_id', preferredCompanies)
    }

    // Apply industry filter if specified  
    if (preferredIndustries.length > 0) {
      query = query.in('annual_reports.companies.industry', preferredIndustries)
    }

    // Get insights with engagement data
    const { data: insights, error } = await query
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw new Error(`Failed to fetch insights: ${error.message}`)
    }

    return insights || []
  }

  /**
   * Record user engagement with insight
   */
  async recordEngagement(
    userId: string,
    insightId: string,
    action: 'view' | 'like' | 'share' | 'bookmark' | 'skip',
    durationSeconds?: number
  ) {
    const { error } = await this.supabase
      .from('insight_engagements')
      .upsert({
        user_id: userId,
        insight_id: insightId,
        action,
        duration_seconds: durationSeconds
      })

    if (error) {
      console.error('Failed to record engagement:', error)
    }
  }

  /**
   * Update user feed preferences
   */
  async updateFeedPreferences(
    userId: string,
    preferences: {
      preferredInsightTypes?: InsightType[]
      preferredCompanies?: string[]
      preferredIndustries?: string[]
      feedAlgorithm?: string
    }
  ) {
    const { error } = await this.supabase
      .from('user_feed_preferences')
      .upsert({
        user_id: userId,
        preferred_insight_types: preferences.preferredInsightTypes,
        preferred_companies: preferences.preferredCompanies,
        preferred_industries: preferences.preferredIndustries,
        feed_algorithm: preferences.feedAlgorithm
      })

    if (error) {
      throw new Error(`Failed to update preferences: ${error.message}`)
    }
  }

  /**
   * Queue insights generation for a report
   */
  async queueInsightsGeneration(
    reportId: string,
    insightTypes: InsightType[],
    priority: number = 0
  ) {
    const { error } = await this.supabase
      .from('insight_processing_queue')
      .insert({
        annual_report_id: reportId,
        insight_types: insightTypes,
        priority
      })

    if (error) {
      throw new Error(`Failed to queue insights: ${error.message}`)
    }
  }

  /**
   * Process insights queue (for background processing)
   */
  async processQueue(batchSize: number = 5) {
    // Get next items from queue
    const { data: queueItems, error: queueError } = await this.supabase
      .from('insight_processing_queue')
      .select('*')
      .is('started_at', null)
      .order('priority', { ascending: false })
      .order('scheduled_for', { ascending: true })
      .limit(batchSize)

    if (queueError || !queueItems?.length) {
      return { processed: 0, errors: [] }
    }

    const results = []
    for (const item of queueItems) {
      try {
        // Mark as started
        await this.supabase
          .from('insight_processing_queue')
          .update({ started_at: new Date().toISOString() })
          .eq('id', item.id)

        // Generate insights
        const insightResults = await this.generateInsightsForReport(
          item.annual_report_id,
          item.insight_types
        )

        const hasErrors = insightResults.some(r => !r.success)
        
        if (hasErrors) {
          // Update queue item with error
          await this.supabase
            .from('insight_processing_queue')
            .update({
              error_message: 'Some insights failed to generate',
              retry_count: item.retry_count + 1
            })
            .eq('id', item.id)
        } else {
          // Mark as completed
          await this.supabase
            .from('insight_processing_queue')
            .update({ completed_at: new Date().toISOString() })
            .eq('id', item.id)
        }

        results.push({ id: item.id, success: !hasErrors, results: insightResults })
      } catch (error) {
        console.error(`Failed to process queue item ${item.id}:`, error)
        
        // Update retry count
        const newRetryCount = item.retry_count + 1
        if (newRetryCount >= item.max_retries) {
          // Max retries reached, mark as failed
          await this.supabase
            .from('insight_processing_queue')
            .update({
              error_message: error instanceof Error ? error.message : 'Unknown error',
              retry_count: newRetryCount
            })
            .eq('id', item.id)
        } else {
          // Schedule for retry
          await this.supabase
            .from('insight_processing_queue')
            .update({
              retry_count: newRetryCount,
              started_at: null,
              scheduled_for: new Date(Date.now() + 60000 * Math.pow(2, newRetryCount)).toISOString() // Exponential backoff
            })
            .eq('id', item.id)
        }

        results.push({ id: item.id, success: false, error: error instanceof Error ? error.message : 'Unknown error' })
      }
    }

    return {
      processed: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    }
  }
}

// Export singleton instance
export const aiInsightsService = new AIInsightsService()