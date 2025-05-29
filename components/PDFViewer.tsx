'use client'

interface PDFViewerProps {
  fileUrl: string
  fileName?: string
}

export default function PDFViewer({ fileUrl, fileName }: PDFViewerProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-4 bg-gray-50 border-b">
        <h3 className="text-lg font-medium">{fileName || 'Annual Report'}</h3>
      </div>
      <div className="p-4">
        <a 
          href={fileUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-500 text-sm"
        >
          Open in New Tab
        </a>
      </div>
      <div className="h-96">
        <iframe src={fileUrl} className="w-full h-full border-0" title="PDF" />
      </div>
    </div>
  )
}