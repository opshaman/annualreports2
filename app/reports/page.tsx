import { createServerSupabaseClient } from '@/app/lib/supabase'
import Link from 'next/link'

export default async function ReportsPage({
  searchParams
}: {
  searchParams: { page?: string }
}) {
  const page = parseInt(searchParams.page || '1')
  const pageSize = 20
  const startIndex = (page - 1) * pageSize
  
  const supabase = await createServerSupabaseClient()
  
  // Fetch reports with company data and pagination
  const { data: reports, error, count } = await supabase
    .from('annual_reports')
    .select(`
      *,
      company:companies(id, company, html_name)
    `, { count: 'exact' })
    .order('filing_date', { ascending: false })
    .range(startIndex, startIndex + pageSize - 1)
  
  // Calculate total pages
  const totalCount = count || 0
  const totalPages = Math.ceil(totalCount / pageSize)
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Annual Reports</h1>
        <Link
          href="/reports/upload"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
          </svg>
          Upload Report
        </Link>
      </div>
      
      <div className="text-right">
        <p className="text-gray-500">
          {reports ? (
            <>
              Showing {startIndex + 1}-{Math.min(startIndex + reports.length, totalCount)} 
              of {totalCount} reports
            </>
          ) : (
            'Loading...'
          )}
        </p>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Error loading reports: {error.message}
        </div>
      )}
      
      {!error && reports?.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
          No annual reports found.
        </div>
      )}
      
      {reports && reports.length > 0 && (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {reports.map((report) => (
              <li key={report.id}>
                <Link 
                  href={`/reports/${report.id}`} 
                  className="block hover:bg-gray-50"
                >
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-blue-600 truncate">
                          {report.company?.company || report.company?.html_name} - {report.year}
                        </p>
                      </div>
                      <div className="ml-2 flex-shrink-0 flex">
                        <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {new Date(report.filing_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          {report.report_type || 'Annual Report'}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Pagination will be added later */}
    </div>
  )
}