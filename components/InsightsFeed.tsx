'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { ChevronUp, ChevronDown, Heart, Share2, Bookmark, MoreHorizontal, TrendingUp, DollarSign, AlertTriangle, Lightbulb } from 'lucide-react'

interface Insight {
  id: string
  insight_type: string
  title: string
  content: string
  summary: string
  key_metrics: Record<string, any>
  confidence_score: number
  created_at: string
  annual_reports: {
    report_type: string
    year: number
    companies: {
      company: string
      industry: string
      sector: string
      ticker_symbol?: string
    }
  }
}

interface InsightCardProps {
  insight: Insight
  isActive: boolean
  onEngagement: (action: string, durationSeconds?: number) => void
}

const InsightCard = ({ insight, isActive, onEngagement }: InsightCardProps) => {
  const [isLiked, setIsLiked] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [showFullContent, setShowFullContent] = useState(false)
  const [viewStartTime, setViewStartTime] = useState<number | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isActive) {
      setViewStartTime(Date.now())
      onEngagement('view')
    } else if (viewStartTime) {
      const duration = Math.floor((Date.now() - viewStartTime) / 1000)
      onEngagement('view', duration)
      setViewStartTime(null)
    }
  }, [isActive, viewStartTime, onEngagement])

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'financial_analysis':
        return <DollarSign className="w-5 h-5 text-green-500" />
      case 'risk_assessment':
        return <AlertTriangle className="w-5 h-5 text-red-500" />
      case 'business_insights':
        return <TrendingUp className="w-5 h-5 text-blue-500" />
      case 'entrepreneurial_recommendations':
        return <Lightbulb className="w-5 h-5 text-yellow-500" />
      default:
        return <TrendingUp className="w-5 h-5 text-blue-500" />
    }
  }

  const getInsightTypeLabel = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  const handleLike = () => {
    setIsLiked(!isLiked)
    onEngagement('like')
  }

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked)
    onEngagement('bookmark')
  }

  const handleShare = () => {
    onEngagement('share')
    navigator.share?.({
      title: insight.title,
      text: insight.summary,
      url: window.location.href
    })
  }

  const renderKeyMetrics = () => {
    if (!insight.key_metrics || Object.keys(insight.key_metrics).length === 0) return null

    return (
      <div className="grid grid-cols-2 gap-3 mt-4">
        {Object.entries(insight.key_metrics).slice(0, 4).map(([key, value]) => (
          <div key={key} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              {key.replace(/_/g, ' ')}
            </div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
              {value}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div 
      ref={cardRef}
      className="h-full w-full bg-white dark:bg-gray-900 flex flex-col relative overflow-hidden snap-start"
    >
      {/* Company Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/60 to-transparent p-6 pb-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">
                {insight.annual_reports.companies.ticker_symbol || 
                 insight.annual_reports.companies.company.charAt(0)}
              </span>
            </div>
            <div>
              <div className="text-white font-semibold text-lg">
                {insight.annual_reports.companies.company}
              </div>
              <div className="text-white/80 text-sm">
                {insight.annual_reports.companies.industry} • {insight.annual_reports.year}
              </div>
            </div>
          </div>
          <button className="text-white/80 hover:text-white">
            <MoreHorizontal className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 pt-32 pb-24 px-6 overflow-y-auto">
        {/* Insight Type Badge */}
        <div className="flex items-center space-x-2 mb-4">
          {getInsightIcon(insight.insight_type)}
          <span className="bg-black/20 dark:bg-white/20 backdrop-blur-sm text-gray-900 text-sm px-3 py-1 rounded-full">
            {getInsightTypeLabel(insight.insight_type)}
          </span>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 mb-4 leading-tight">
          {insight.title}
        </h2>

        {/* Summary */}
        <p className="text-gray-900 text-lg mb-6 leading-relaxed">
          {insight.summary}
        </p>

        {/* Key Metrics */}
        {renderKeyMetrics()}

        {/* Full Content Toggle */}
        {insight.content && insight.content !== insight.summary && (
          <div className="mt-6">
            <button
              onClick={() => setShowFullContent(!showFullContent)}
              className="text-gray-900 hover:text-white text-sm flex items-center space-x-1"
            >
              <span>{showFullContent ? 'Show Less' : 'Read Full Analysis'}</span>
              {showFullContent ? 
                <ChevronUp className="w-4 h-4" /> : 
                <ChevronDown className="w-4 h-4" />
              }
            </button>
            
            {showFullContent && (
              <div className="mt-4 text-gray-900 text-sm leading-relaxed whitespace-pre-wrap">
                {insight.content}
              </div>
            )}
          </div>
        )}

        {/* Confidence Score */}
        <div className="mt-6 flex items-center space-x-2">
          <div className="text-white/60 text-xs">Confidence</div>
          <div className="flex-1 bg-white/20 rounded-full h-1.5">
            <div 
              className="bg-gradient-to-r from-green-400 to-blue-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${(insight.confidence_score || 0.75) * 100}%` }}
            />
          </div>
          <div className="text-white text-xs font-medium">
            {Math.round((insight.confidence_score || 0.75) * 100)}%
          </div>
        </div>
      </div>

      {/* Actions Sidebar */}
      <div className="absolute right-4 bottom-32 flex flex-col space-y-6">
        <button
          onClick={handleLike}
          className={`p-3 rounded-full backdrop-blur-sm transition-all ${
            isLiked 
              ? 'bg-red-500 text-white' 
              : 'bg-black/30 text-white hover:bg-black/50'
          }`}
        >
          <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
        </button>
        
        <button
          onClick={handleShare}
          className="p-3 rounded-full bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 transition-all"
        >
          <Share2 className="w-6 h-6" />
        </button>
        
        <button
          onClick={handleBookmark}
          className={`p-3 rounded-full backdrop-blur-sm transition-all ${
            isBookmarked 
              ? 'bg-blue-500 text-white' 
              : 'bg-black/30 text-white hover:bg-black/50'
          }`}
        >
          <Bookmark className={`w-6 h-6 ${isBookmarked ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 -z-10" />
      
      {/* Pattern Overlay */}
      <div className="absolute inset-0 opacity-10 -z-10" 
           style={{
             backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='7' cy='7' r='2'/%3E%3Ccircle cx='53' cy='7' r='2'/%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3Ccircle cx='7' cy='53' r='2'/%3E%3Ccircle cx='53' cy='53' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
           }} />
    </div>
  )
}

const InsightsFeed = () => {
  const [insights, setInsights] = useState<Insight[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  const touchStartY = useRef<number>(0)
  const touchEndY = useRef<number>(0)

  // Fetch insights
  const fetchInsights = useCallback(async (offset = 0) => {
    try {
      const response = await fetch(`/api/insights/feed?limit=10&offset=${offset}`)
      const data = await response.json()
      
      if (data.success) {
        if (offset === 0) {
          setInsights(data.insights)
        } else {
          setInsights(prev => [...prev, ...data.insights])
        }
        setHasMore(data.hasMore)
      }
    } catch (error) {
      console.error('Failed to fetch insights:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchInsights(0)
  }, [fetchInsights])

  // Load more insights when near the end
  useEffect(() => {
    if (currentIndex >= insights.length - 3 && hasMore && !loading) {
      fetchInsights(insights.length)
    }
  }, [currentIndex, insights.length, hasMore, loading, fetchInsights])

  // Handle engagement
  const handleEngagement = useCallback(async (action: string, durationSeconds?: number) => {
    if (!insights[currentIndex]) return

    try {
      await fetch('/api/insights/engagement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          insightId: insights[currentIndex].id,
          action,
          durationSeconds
        })
      })
    } catch (error) {
      console.error('Failed to record engagement:', error)
    }
  }, [insights, currentIndex])

  // Touch handlers for swipe navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.targetTouches[0].clientY
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndY.current = e.changedTouches[0].clientY
    handleSwipe()
  }

  const handleSwipe = () => {
    const swipeThreshold = 50
    const diff = touchStartY.current - touchEndY.current

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        // Swipe up - next insight
        goToNext()
      } else {
        // Swipe down - previous insight
        goToPrevious()
      }
    }
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault()
          goToNext()
          break
        case 'ArrowDown':
          e.preventDefault()
          goToPrevious()
          break
        case ' ':
          e.preventDefault()
          goToNext()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentIndex, insights.length])

  const goToNext = () => {
    if (currentIndex < insights.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const goToInsight = (index: number) => {
    setCurrentIndex(index)
  }

  if (loading && insights.length === 0) {
    return (
      <div className="h-screen w-full bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading insights...</p>
        </div>
      </div>
    )
  }

  if (insights.length === 0) {
    return (
      <div className="h-screen w-full bg-gray-900 flex items-center justify-center">
        <div className="text-center px-6">
          <TrendingUp className="w-24 h-24 text-gray-500 mx-auto mb-6" />
          <h2 className="text-white text-2xl font-bold mb-4">No Insights Available</h2>
          <p className="text-gray-400 text-lg mb-8">
            Check back later for AI-generated insights from annual reports.
          </p>
          <button 
            onClick={() => fetchInsights(0)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-full relative overflow-hidden bg-black">
      {/* Main Feed Container */}
      <div
        ref={containerRef}
        className="h-full w-full snap-y snap-mandatory overflow-y-auto scrollbar-hide"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateY(-${currentIndex * 100}vh)`,
          transition: 'transform 0.3s ease-out'
        }}
      >
        {insights.map((insight, index) => (
          <InsightCard
            key={insight.id}
            insight={insight}
            isActive={index === currentIndex}
            onEngagement={handleEngagement}
          />
        ))}
      </div>

      {/* Navigation Indicators */}
      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20">
        <div className="flex flex-col space-y-2">
          {insights.map((_, index) => (
            <button
              key={index}
              onClick={() => goToInsight(index)}
              className={`w-1 h-8 rounded-full transition-all ${
                index === currentIndex 
                  ? 'bg-white' 
                  : 'bg-white/30 hover:bg-white/50'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Navigation Arrows */}
      <div className="absolute right-6 top-1/2 transform -translate-y-1/2 z-20 flex flex-col space-y-4">
        <button
          onClick={goToPrevious}
          disabled={currentIndex === 0}
          className={`p-3 rounded-full backdrop-blur-sm transition-all ${
            currentIndex === 0
              ? 'bg-white/10 text-white/30 cursor-not-allowed'
              : 'bg-white/20 text-white hover:bg-white/30'
          }`}
        >
          <ChevronUp className="w-6 h-6" />
        </button>
        
        <button
          onClick={goToNext}
          disabled={currentIndex === insights.length - 1}
          className={`p-3 rounded-full backdrop-blur-sm transition-all ${
            currentIndex === insights.length - 1
              ? 'bg-white/10 text-white/30 cursor-not-allowed'
              : 'bg-white/20 text-white hover:bg-white/30'
          }`}
        >
          <ChevronDown className="w-6 h-6" />
        </button>
      </div>

      {/* Loading indicator for more content */}
      {loading && insights.length > 0 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20">
          <div className="bg-black/50 backdrop-blur-sm rounded-full px-4 py-2">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span className="text-white text-sm">Loading more...</span>
            </div>
          </div>
        </div>
      )}

      {/* Hide scrollbar */}
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}

export default InsightsFeed