import { createServerSupabaseClient } from '@/app/lib/supabase'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function CompanyDetailPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  const supabase = await createServerSupabaseClient()
  
  // Fetch company details
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select('*')
    .eq('id', params.id)
    .single()
  
  if (companyError || !company) {
    notFound()
  }
  
  // Fetch reports for this company
  const { data: reports, error: reportsError } = await supabase
    .from('annual_reports')
    .select('*')
    .eq('company_id', company.id)
    .order('year', { ascending: false })
  
  return (
    <div className="space-y-8">
      {/* Company header */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {company.company || company.html_name}
          </h1>
          <div className="mt-1 flex flex-wrap gap-2">
            {company.industry && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {company.industry}
              </span>
            )}
            {company.sector && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {company.sector}
              </span>
            )}
          </div>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
            {company.text_only && (
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Latest Report</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <Link href={`/reports/${company.latest_pdf}`} className="text-blue-600 hover:text-blue-500">
                    View Latest Report
                  </Link>
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>
      
      {/* Company reports */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Annual Reports</h2>
        
        {reportsError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            Error loading reports: {reportsError.message}
          </div>
        )}
        
        {!reportsError && (!reports || reports.length === 0) && (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
            <p className="text-gray-700">No annual reports available for this company.</p>
            {company.latest_pdf && (
              <p className="mt-2">
                <Link href={`/reports/${company.latest_pdf}`} className="text-blue-600 hover:text-blue-500">
                  View Latest Report from Homepage
                </Link>
              </p>
            )}
          </div>
        )}
        
        {reports && reports.length > 0 && (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
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
                            {report.year} Annual Report
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
      </div>
    </div>
  )
}