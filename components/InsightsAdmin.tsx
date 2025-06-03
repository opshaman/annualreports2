'use client'

import React, { useState, useEffect } from 'react'
import { Play, Pause, RefreshCw, AlertCircle, CheckCircle, Clock, Zap, BarChart3, TrendingUp, DollarSign, AlertTriangle, Lightbulb, Globe, Users, Leaf } from 'lucide-react'

interface Report {
  id: string
  title: string
  year: number
  companies: {
    name: string
    industry: string
    ticker_symbol: string
  }
}

interface QueueItem {
  id: string
  annual_report_id: string
  insight_types: string[]
  priority: number
  retry_count: number
  max_retries: number
  scheduled_for: string
  started_at?: string
  completed_at?: string
  error_message?: string
  created_at: string
  annual_reports: {
    title: string
    companies: { name: string }
  }
}

interface QueueStats {
  pending: number
  processing: number
  completed: number
  failed: number
}

const InsightTypeIcon = ({ type }: { type: string }) => {
  const icons = {
    financial_analysis: DollarSign,
    risk_assessment: AlertTriangle,
    business_insights: TrendingUp,
    entrepreneurial_recommendations: Lightbulb,
    executive_summary: BarChart3,
    market_analysis: Globe,
    competitive_analysis: Users,
    esg_analysis: Leaf
  }
  
  const Icon = icons[type as keyof typeof icons] || TrendingUp
  return <Icon className="w-4 h-4" />
}

const InsightsAdmin = () => {
  const [reports, setReports] = useState<Report[]>([])
  const [queueItems, setQueueItems] = useState<QueueItem[]>([])
  const [queueStats, setQueueStats] = useState<QueueStats>({ pending: 0, processing: 0, completed: 0, failed: 0 })
  const [selectedReport, setSelectedReport] = useState<string>('')
  const [selectedInsightTypes, setSelectedInsightTypes] = useState<string[]>(['financial_analysis', 'business_insights'])
  const [priority, setPriority] = useState(0)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)

  const insightTypes = [
    { value: 'financial_analysis', label: 'Financial Analysis', color: 'text-green-600' },
    { value: 'risk_assessment', label: 'Risk Assessment', color: 'text-red-600' },
    { value: 'business_insights', label: 'Business Insights', color: 'text-blue-600' },
    { value: 'entrepreneurial_recommendations', label: 'Entrepreneurial Recommendations', color: 'text-yellow-600' },
    { value: 'executive_summary', label: 'Executive Summary', color: 'text-purple-600' },
    { value: 'market_analysis', label: 'Market Analysis', color: 'text-indigo-600' },
    { value: 'competitive_analysis', label: 'Competitive Analysis', color: 'text-pink-600' },
    { value: 'esg_analysis', label: 'ESG Analysis', color: 'text-emerald-600' }
  ]

  // Fetch reports
  useEffect(() => {
    fetchReports()
    fetchQueueStatus()
    
    // Set up polling for queue status
    const interval = setInterval(fetchQueueStatus, 5000)
    return () => clearInterval(interval)
  }, [])

  const fetchReports = async () => {
    try {
      const response = await fetch('/api/reports')
      const data = await response.json()
      if (data.success) {
        setReports(data.reports)
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error)
    }
  }

  const fetchQueueStatus = async () => {
    try {
      const response = await fetch('/api/insights/queue')
      const data = await response.json()
      if (data.success) {
        setQueueStats(data.stats)
        setQueueItems(data.items)
      }
    } catch (error) {
      console.error('Failed to fetch queue status:', error)
    }
  }

  const handleGenerateInsights = async () => {
    if (!selectedReport || selectedInsightTypes.length === 0) return

    setGenerating(true)
    try {
      const response = await fetch('/api/insights/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId: selectedReport,
          insightTypes: selectedInsightTypes,
          priority
        })
      })

      const data = await response.json()
      if (data.success) {
        alert(`Successfully generated ${data.totalGenerated} insights!`)
        fetchQueueStatus()
      } else {
        alert('Failed to generate insights')
      }
    } catch (error) {
      console.error('Failed to generate insights:', error)
      alert('Failed to generate insights')
    } finally {
      setGenerating(false)
    }
  }

  const handleQueueInsights = async () => {
    if (!selectedReport || selectedInsightTypes.length === 0) return

    setLoading(true)
    try {
      const response = await fetch('/api/insights/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId: selectedReport,
          insightTypes: selectedInsightTypes,
          priority
        })
      })

      const data = await response.json()
      if (data.success) {
        alert('Insights queued for processing!')
        fetchQueueStatus()
        setSelectedReport('')
        setSelectedInsightTypes(['financial_analysis', 'business_insights'])
      } else {
        alert('Failed to queue insights')
      }
    } catch (error) {
      console.error('Failed to queue insights:', error)
      alert('Failed to queue insights')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (item: QueueItem) => {
    if (item.completed_at) {
      return <CheckCircle className="w-5 h-5 text-green-500" />
    } else if (item.started_at) {
      return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
    } else if (item.retry_count >= item.max_retries) {
      return <AlertCircle className="w-5 h-5 text-red-500" />
    } else {
      return <Clock className="w-5 h-5 text-yellow-500" />
    }
  }

  const getStatusLabel = (item: QueueItem) => {
    if (item.completed_at) return 'Completed'
    if (item.started_at) return 'Processing'
    if (item.retry_count >= item.max_retries) return 'Failed'
    return 'Pending'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">AI Insights Management</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Generate and manage AI-powered insights from annual reports
        </p>
      </div>

      {/* Queue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-yellow-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{queueStats.pending}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <RefreshCw className="w-8 h-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Processing</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{queueStats.processing}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{queueStats.completed}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <AlertCircle className="w-8 h-8 text-red-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Failed</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{queueStats.failed}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Generate Insights Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Generate New Insights</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Report Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Report
            </label>
            <select
              value={selectedReport}
              onChange={(e) => setSelectedReport(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Choose a report...</option>
              {reports.map((report) => (
                <option key={report.id} value={report.id}>
                  {report.companies.name} - {report.title} ({report.year})
                </option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(parseInt(e.target.value))}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={0}>Normal</option>
              <option value={1}>High</option>
              <option value={2}>Urgent</option>
            </select>
          </div>
        </div>

        {/* Insight Types Selection */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
            Select Insight Types
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {insightTypes.map((type) => (
              <label key={type.value} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedInsightTypes.includes(type.value)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedInsightTypes([...selectedInsightTypes, type.value])
                    } else {
                      setSelectedInsightTypes(selectedInsightTypes.filter(t => t !== type.value))
                    }
                  }}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <div className="flex items-center space-x-2">
                  <InsightTypeIcon type={type.value} />
                  <span className={`text-sm ${type.color} font-medium`}>{type.label}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4 mt-6">
          <button
            onClick={handleGenerateInsights}
            disabled={!selectedReport || selectedInsightTypes.length === 0 || generating}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            {generating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                <span>Generate Now</span>
              </>
            )}
          </button>
          
          <button
            onClick={handleQueueInsights}
            disabled={!selectedReport || selectedInsightTypes.length === 0 || loading}
            className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Queueing...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Queue for Later</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Queue Items */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Processing Queue</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Report
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Insight Types
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Retries
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {queueItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(item)}
                      <span className="text-sm text-gray-900 dark:text-white">
                        {getStatusLabel(item)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white font-medium">
                      {item.annual_reports.companies.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {item.annual_reports.title}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {item.insight_types.map((type) => (
                        <span
                          key={type}
                          className="inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        >
                          <InsightTypeIcon type={type} />
                          <span>{type.replace('_', ' ')}</span>
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      item.priority === 2 ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                      item.priority === 1 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                    }`}>
                      {item.priority === 2 ? 'Urgent' : item.priority === 1 ? 'High' : 'Normal'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(item.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm ${
                      item.retry_count >= item.max_retries ? 'text-red-600' : 'text-gray-900 dark:text-white'
                    }`}>
                      {item.retry_count} / {item.max_retries}
                    </span>
                    {item.error_message && (
                      <div className="text-xs text-red-500 mt-1 max-w-xs truncate" title={item.error_message}>
                        {item.error_message}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {queueItems.length === 0 && (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-lg">No items in queue</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm">
                Queue insights above to see them here
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default InsightsAdmin