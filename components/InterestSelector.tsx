'use client'

import React, { useState, useEffect } from 'react'
import { Check, TrendingUp, DollarSign, AlertTriangle, Lightbulb, Building2, Factory, Zap, ShoppingCart, Landmark, Truck, Pill, Cpu, Wrench, Plane } from 'lucide-react'

interface Interest {
  id: string
  label: string
  description: string
  category: 'insight_type' | 'industry' | 'sector'
  icon: React.ReactNode
}

interface InterestSelectorProps {
  selectedInterests: string[]
  onInterestsChange: (interests: string[]) => void
  disabled?: boolean
}

const INTEREST_OPTIONS: Interest[] = [
  // Insight Types
  {
    id: 'financial_analysis',
    label: 'Financial Analysis',
    description: 'Revenue, profits, cash flow insights',
    category: 'insight_type',
    icon: <DollarSign className="w-5 h-5" />
  },
  {
    id: 'risk_assessment',
    label: 'Risk Assessment',
    description: 'Market risks, regulatory challenges',
    category: 'insight_type',
    icon: <AlertTriangle className="w-5 h-5" />
  },
  {
    id: 'business_insights',
    label: 'Business Strategy',
    description: 'Growth plans, market positioning',
    category: 'insight_type',
    icon: <TrendingUp className="w-5 h-5" />
  },
  {
    id: 'entrepreneurial_recommendations',
    label: 'Innovation & Opportunities',
    description: 'New ventures, emerging trends',
    category: 'insight_type',
    icon: <Lightbulb className="w-5 h-5" />
  },

  // Industries
  {
    id: 'technology',
    label: 'Technology',
    description: 'Software, hardware, digital services',
    category: 'industry',
    icon: <Cpu className="w-5 h-5" />
  },
  {
    id: 'healthcare',
    label: 'Healthcare',
    description: 'Pharmaceuticals, medical devices, services',
    category: 'industry',
    icon: <Pill className="w-5 h-5" />
  },
  {
    id: 'financial_services',
    label: 'Financial Services',
    description: 'Banking, insurance, fintech',
    category: 'industry',
    icon: <Landmark className="w-5 h-5" />
  },
  {
    id: 'energy',
    label: 'Energy',
    description: 'Oil, gas, renewables, utilities',
    category: 'industry',
    icon: <Zap className="w-5 h-5" />
  },
  {
    id: 'manufacturing',
    label: 'Manufacturing',
    description: 'Industrial production, machinery',
    category: 'industry',
    icon: <Factory className="w-5 h-5" />
  },
  {
    id: 'consumer_goods',
    label: 'Consumer Goods',
    description: 'Retail, food & beverage, apparel',
    category: 'industry',
    icon: <ShoppingCart className="w-5 h-5" />
  },
  {
    id: 'transportation',
    label: 'Transportation',
    description: 'Airlines, logistics, automotive',
    category: 'industry',
    icon: <Truck className="w-5 h-5" />
  },
  {
    id: 'real_estate',
    label: 'Real Estate',
    description: 'Property development, REITs',
    category: 'industry',
    icon: <Building2 className="w-5 h-5" />
  },
  {
    id: 'aerospace',
    label: 'Aerospace & Defense',
    description: 'Aviation, defense contractors',
    category: 'industry',
    icon: <Plane className="w-5 h-5" />
  },
  {
    id: 'industrial',
    label: 'Industrial Services',
    description: 'Construction, engineering services',
    category: 'industry',
    icon: <Wrench className="w-5 h-5" />
  }
]

const InterestSelector: React.FC<InterestSelectorProps> = ({
  selectedInterests,
  onInterestsChange,
  disabled = false
}) => {
  const [expandedCategory, setExpandedCategory] = useState<string | null>('insight_type')

  const toggleInterest = (interestId: string) => {
    if (disabled) return
    
    if (selectedInterests.includes(interestId)) {
      onInterestsChange(selectedInterests.filter(id => id !== interestId))
    } else {
      onInterestsChange([...selectedInterests, interestId])
    }
  }

  const toggleCategory = (category: string) => {
    setExpandedCategory(expandedCategory === category ? null : category)
  }

  const getCategoryInterests = (category: string) => {
    return INTEREST_OPTIONS.filter(interest => interest.category === category)
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'insight_type':
        return 'Insight Types'
      case 'industry':
        return 'Industries'
      case 'sector':
        return 'Sectors'
      default:
        return category
    }
  }

  const getCategoryDescription = (category: string) => {
    switch (category) {
      case 'insight_type':
        return 'What type of analysis interests you most?'
      case 'industry':
        return 'Which industries do you want to follow?'
      case 'sector':
        return 'Specific business sectors of interest'
      default:
        return ''
    }
  }

  const categories = ['insight_type', 'industry']

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Customize Your Insights Feed
        </h3>
        <p className="text-sm text-gray-600">
          Select your interests to get personalized insights from annual reports
        </p>
      </div>

      {categories.map(category => (
        <div key={category} className="border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleCategory(category)}
            className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 text-left transition-colors"
            disabled={disabled}
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">
                  {getCategoryLabel(category)}
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  {getCategoryDescription(category)}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  {getCategoryInterests(category).filter(interest => 
                    selectedInterests.includes(interest.id)
                  ).length} selected
                </span>
                <div className={`transform transition-transform ${
                  expandedCategory === category ? 'rotate-180' : ''
                }`}>
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </button>

          {expandedCategory === category && (
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {getCategoryInterests(category).map(interest => (
                  <button
                    key={interest.id}
                    onClick={() => toggleInterest(interest.id)}
                    disabled={disabled}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      selectedInterests.includes(interest.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`flex-shrink-0 p-2 rounded-lg ${
                        selectedInterests.includes(interest.id)
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {interest.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h5 className="font-medium text-gray-900 text-sm">
                            {interest.label}
                          </h5>
                          {selectedInterests.includes(interest.id) && (
                            <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          {interest.description}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}

      {selectedInterests.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h5 className="font-medium text-blue-900 mb-2">
            Your Selected Interests ({selectedInterests.length})
          </h5>
          <div className="flex flex-wrap gap-2">
            {selectedInterests.map(interestId => {
              const interest = INTEREST_OPTIONS.find(opt => opt.id === interestId)
              return interest ? (
                <span
                  key={interestId}
                  className="inline-flex items-center space-x-1 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                >
                  <span>{interest.icon}</span>
                  <span>{interest.label}</span>
                </span>
              ) : null
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default InterestSelector