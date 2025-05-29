import { createServerSupabaseClient } from '@/app/lib/supabase'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import PDFViewer from '@/components/PDFViewer'

export default async function ReportDetailPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  const supabase = await createServerSupabaseClient()
  
  // Fetch report details with company information
  const { data: report, error } = await supabase
    .from('annual_reports')
    .select(`
      *,
      company:companies(*)
    `)
    .eq('id', params.id)
    .single()
  
  if (error || !report) {
    notFound()
  }
  
  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold">
          {report.year} Annual Report - {report.company?.company || report.company?.html_name}
        </h1>
        
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Filing Date</p>
            <p className="font-medium">{new Date(report.filing_date).toLocaleDateString()}</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-500">Report Type</p>
            <p className="font-medium">{report.report_type || 'Annual Report'}</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-500">Fiscal Year End</p>
            <p className="font-medium">
              {report.fiscal_year_end ? new Date(report.fiscal_year_end).toLocaleDateString() : 'N/A'}
            </p>
          </div>
          
          <div>
            <p className="text-sm text-gray-500">Language</p>
            <p className="font-medium">{report.language ? report.language.toUpperCase() : 'EN'}</p>
          </div>
        </div>
      </div>
      
      {report.file_url ? (
        <PDFViewer 
          fileUrl={report.file_url} 
          fileName={`${report.company?.company || report.company?.html_name} - ${report.year} Annual Report.pdf`}
        />
      ) : (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <h2 className="text-lg font-medium">No PDF Available</h2>
          <p className="text-gray-500">
            This report does not have an associated PDF file.
          </p>
        </div>
      )}
      
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