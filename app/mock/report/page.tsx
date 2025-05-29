import Link from 'next/link'

export default function MockReportPage() {
  // Mock report data
  const report = {
    id: 'mock-report-id',
    year: 2024,
    company_id: 'mock-company-id',
    report_type: 'Annual Report',
    filing_date: new Date().toISOString(),
    fiscal_year_end: new Date().toISOString(),
    file_url: 'https://www.africau.edu/images/default/sample.pdf', // A sample PDF for testing
    language: 'en',
    company: {
      id: 'mock-company-id',
      company: 'Mock Company, Inc.',
      html_name: 'Mock Company, Inc.',
      industry: 'Technology',
      sector: 'Software'
    }
  }
  
  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold">
          {report.year} Annual Report - {report.company.company}
        </h1>
        
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Filing Date</p>
            <p className="font-medium">{new Date(report.filing_date).toLocaleDateString()}</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-500">Report Type</p>
            <p className="font-medium">{report.report_type}</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-500">Fiscal Year End</p>
            <p className="font-medium">
              {new Date(report.fiscal_year_end).toLocaleDateString()}
            </p>
          </div>
          
          <div>
            <p className="text-sm text-gray-500">Language</p>
            <p className="font-medium">{report.language.toUpperCase()}</p>
          </div>
        </div>
        
        {report.file_url && (
          <div className="mt-6">
            <a 
              href={report.file_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Download Sample PDF
            </a>
          </div>
        )}
      </div>
      
      <div className="bg-white shadow rounded-lg p-6 text-center">
        <div className="mx-auto h-24 w-24 text-gray-400">
          <svg className="h-full w-full" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 14.5a1 1 0 100-2 1 1 0 000 2zm0-4a1 1 0 100-2 1 1 0 000 2zm0-4a1 1 0 100-2 1 1 0 000 2zm0 12a1 1 0 100-2 1 1 0 000 2z" />
          </svg>
        </div>
        
        <h2 className="mt-2 text-lg font-medium">PDF Viewer Coming Soon</h2>
        <p className="mt-1 text-gray-500">
          We're working on integrating a PDF viewer for this report.
        </p>
        
        <div className="mt-6 border p-4 rounded bg-gray-50">
          <p className="text-sm text-gray-700">
            <strong>Note:</strong> This is a mock report page for testing purposes. 
            It displays a sample PDF to demonstrate the UI.
          </p>
        </div>
      </div>
      
      <div>
        <Link 
          href="/reports"
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          ← Back to Reports
        </Link>
      </div>
    </div>
  )
}