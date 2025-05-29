'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/app/providers'
import FileUpload from '@/components/FileUpload'
import Link from 'next/link'

export default function UploadReportPage() {
  const [formData, setFormData] = useState({
    company_id: '',
    year: new Date().getFullYear(),
    report_type: 'Annual Report',
    filing_date: new Date().toISOString().split('T')[0],
    fiscal_year_end: '',
    file_url: '',
    file_name: ''
  })
  const [companies, setCompanies] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { supabase, user } = useSupabase()
  const router = useRouter()

  // Fetch companies on component mount
  useState(() => {
    const fetchCompanies = async () => {
      const { data } = await supabase
        .from('companies')
        .select('id, company, html_name')
        .order('company', { ascending: true })
        .limit(100)
      
      if (data) {
        setCompanies(data)
      }
    }
    fetchCompanies()
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleFileUpload = (url: string, fileName: string) => {
    setFormData(prev => ({
      ...prev,
      file_url: url,
      file_name: fileName
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      setError('You must be logged in to upload reports')
      return
    }

    if (!formData.file_url) {
      setError('Please upload a PDF file')
      return
    }

    if (!formData.company_id) {
      setError('Please select a company')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error: insertError } = await supabase
        .from('annual_reports')
        .insert([
          {
            company_id: formData.company_id,
            year: formData.year,
            report_type: formData.report_type,
            filing_date: formData.filing_date,
            fiscal_year_end: formData.fiscal_year_end || null,
            file_url: formData.file_url,
            language: 'en',
            has_been_processed: false
          }
        ])
        .select()

      if (insertError) throw insertError

      // Redirect to the newly created report
      if (data && data[0]) {
        router.push(`/reports/${data[0].id}`)
      } else {
        router.push('/reports')
      }
      
    } catch (error) {
      console.error('Error creating report:', error)
      setError(error instanceof Error ? error.message : 'Failed to create report')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Upload Annual Report</h1>
        <p className="text-gray-600 mt-2">
          Upload a new annual report to the database.
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Selection */}
        <div>
          <label htmlFor="company_id" className="block text-sm font-medium text-gray-700 mb-2">
            Company *
          </label>
          <select
            id="company_id"
            name="company_id"
            value={formData.company_id}
            onChange={handleInputChange}
            required
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select a company...</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.company || company.html_name}
              </option>
            ))}
          </select>
        </div>

        {/* Year */}
        <div>
          <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-2">
            Year *
          </label>
          <input
            type="number"
            id="year"
            name="year"
            value={formData.year}
            onChange={handleInputChange}
            min="1990"
            max={new Date().getFullYear() + 1}
            required
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Report Type */}
        <div>
          <label htmlFor="report_type" className="block text-sm font-medium text-gray-700 mb-2">
            Report Type
          </label>
          <select
            id="report_type"
            name="report_type"
            value={formData.report_type}
            onChange={handleInputChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="Annual Report">Annual Report</option>
            <option value="10-K">10-K</option>
            <option value="10-Q">10-Q</option>
            <option value="8-K">8-K</option>
          </select>
        </div>

        {/* Filing Date */}
        <div>
          <label htmlFor="filing_date" className="block text-sm font-medium text-gray-700 mb-2">
            Filing Date *
          </label>
          <input
            type="date"
            id="filing_date"
            name="filing_date"
            value={formData.filing_date}
            onChange={handleInputChange}
            required
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Fiscal Year End */}
        <div>
          <label htmlFor="fiscal_year_end" className="block text-sm font-medium text-gray-700 mb-2">
            Fiscal Year End
          </label>
          <input
            type="date"
            id="fiscal_year_end"
            name="fiscal_year_end"
            value={formData.fiscal_year_end}
            onChange={handleInputChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            PDF File *
          </label>
          <FileUpload 
            onUploadComplete={handleFileUpload}
            disabled={loading}
          />
          {formData.file_name && (
            <p className="mt-2 text-sm text-green-600">
              ✓ Uploaded: {formData.file_name}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading || !formData.file_url}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Report...' : 'Create Report'}
          </button>
          
          <Link
            href="/reports"
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-center"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}