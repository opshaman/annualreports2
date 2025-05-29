import { createServerSupabaseClient } from './lib/supabase'
import Link from 'next/link'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'

// Define types for our data
type Company = {
  id: string
  company: string | null
  html_name: string | null
  industry: string | null
  sector: string | null
}

// Simpler approach - using any for now to fix the error
export default async function Home() {
  const supabase = await createServerSupabaseClient()
  
  // Fetch recent companies
  const { data: recentCompanies } = await supabase
    .from('companies')
    .select('id, company, html_name, industry, sector')
    .order('created_at', { ascending: false })
    .limit(5)
  
  // Fetch recent reports
  const { data: recentReports } = await supabase
    .from('annual_reports')
    .select(`
      id, 
      year, 
      report_type, 
      filing_date,
      company:companies(id, company, html_name)
    `)
    .order('filing_date', { ascending: false })
    .limit(5)
  
  return (
    <div className="space-y-12">
      {/* Hero section */}
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          AnnualReports 2.0
        </h1>
        <p className="mt-6 text-lg leading-8 text-gray-600 max-w-3xl mx-auto">
          Access and analyze annual reports from thousands of companies. 
          Get insights, download reports, and stay informed about corporate performance.
        </p>
        
        {/* Large centered search bar */}
        <div className="mt-8 max-w-md mx-auto">
          <form action="/search" method="get" className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
            <input 
              type="search" 
              name="q"
              className="block w-full p-4 pl-10 text-sm border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" 
              placeholder="Search for companies or annual reports..." 
              required
            />
            <button 
              type="submit" 
              className="absolute right-2 bottom-2 top-2 px-4 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300"
            >
              Search
            </button>
          </form>
        </div>
        
        <div className="mt-8 flex items-center justify-center gap-6">
          <Link
            href="/companies"
            className="rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Browse Companies
          </Link>
          <Link
            href="/reports"
            className="rounded-md bg-gray-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600"
          >
            View Reports
          </Link>
        </div>
      </div>
      
      {/* Rest of the code remains the same */}
      {/* Stats section */}
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-px bg-white/5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white p-8 sm:p-10">
            <div className="text-base font-semibold leading-7 text-gray-900">Companies</div>
            <div className="mt-2 flex items-baseline gap-x-2">
              <span className="text-4xl font-bold tracking-tight text-blue-600">10,000+</span>
            </div>
          </div>
          <div className="bg-white p-8 sm:p-10">
            <div className="text-base font-semibold leading-7 text-gray-900">Annual Reports</div>
            <div className="mt-2 flex items-baseline gap-x-2">
              <span className="text-4xl font-bold tracking-tight text-blue-600">150,000+</span>
            </div>
          </div>
          <div className="bg-white p-8 sm:p-10">
            <div className="text-base font-semibold leading-7 text-gray-900">Industries</div>
            <div className="mt-2 flex items-baseline gap-x-2">
              <span className="text-4xl font-bold tracking-tight text-blue-600">50+</span>
            </div>
          </div>
          <div className="bg-white p-8 sm:p-10">
            <div className="text-base font-semibold leading-7 text-gray-900">Years of Data</div>
            <div className="mt-2 flex items-baseline gap-x-2">
              <span className="text-4xl font-bold tracking-tight text-blue-600">20+</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Recent content section */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Recent companies */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Recent Companies</h3>
            </div>
            <ul className="divide-y divide-gray-200">
              {recentCompanies?.map((company: any) => (
                <li key={company.id}>
                  <Link 
                    href={`/companies/${company.id}`}
                    className="block hover:bg-gray-50 px-4 py-4"
                  >
                    <p className="text-sm font-medium text-blue-600">{company.company || company.html_name}</p>
                    <p className="text-sm text-gray-500 mt-1">{company.industry || 'No industry'}</p>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="px-4 py-4 sm:px-6 bg-gray-50 border-t">
              <Link 
                href="/companies"
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                View all companies →
              </Link>
            </div>
          </div>
          
          {/* Recent reports */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Recent Reports</h3>
            </div>
            <ul className="divide-y divide-gray-200">
              {recentReports?.map((report: any) => {
                // Get the first company from the array
                const companyData = Array.isArray(report.company) ? report.company[0] : report.company;
                return (
                  <li key={report.id}>
                    <Link 
                      href={`/reports/${report.id}`}
                      className="block hover:bg-gray-50 px-4 py-4"
                    >
                      <p className="text-sm font-medium text-blue-600">
                        {companyData?.company || companyData?.html_name} - {report.year}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Filed: {new Date(report.filing_date).toLocaleDateString()}
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <div className="px-4 py-4 sm:px-6 bg-gray-50 border-t">
              <Link 
                href="/reports"
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                View all reports →
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Feature section */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Coming Soon</h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h4 className="text-lg font-medium mb-2">AI Insights</h4>
                <p className="text-gray-600">
                  Advanced AI analysis of annual reports to extract key metrics, trends, and insights.
                </p>
              </div>
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h4 className="text-lg font-medium mb-2">Interactive Dashboards</h4>
                <p className="text-gray-600">
                  Visualize financial data and performance metrics with interactive charts and graphs.
                </p>
              </div>
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="text-lg font-medium mb-2">TikTok-Style Feed</h4>
                <p className="text-gray-600">
                  Swipeable, engaging content feed that makes it easy to consume financial insights.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}