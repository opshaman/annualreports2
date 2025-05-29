import { createServerSupabaseClient } from '@/app/lib/supabase'
import Link from 'next/link'

export default async function SearchPage({ 
  searchParams 
}: { 
  searchParams: { q?: string } 
}) {
  const query = searchParams.q || ''
  
  if (!query) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Search</h1>
        <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
          <p className="text-gray-700">Enter a search query in the search bar above to find companies and reports.</p>
        </div>
      </div>
    )
  }
  
  const supabase = await createServerSupabaseClient()
  
  // Search for companies
  const { data: companies, error: companiesError } = await supabase
    .from('companies')
    .select('*')
    .or(`company.ilike.%${query}%,html_name.ilike.%${query}%,industry.ilike.%${query}%,sector.ilike.%${query}%`)
    .limit(10)
  
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Search Results for "{query}"</h1>
      
      {/* Companies Results */}
      <div className="mb-10">
        <h2 className="text-xl font-semibold mb-3">Companies</h2>
        
        {companiesError ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            Error searching companies: {companiesError.message}
          </div>
        ) : (
          <>
            {companies && companies.length > 0 ? (
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <ul className="divide-y divide-gray-200">
                  {companies.map((company) => (
                    <li key={company.id}>
                      <Link 
                        href={`/companies/${company.id}`} 
                        className="block hover:bg-gray-50"
                      >
                        <div className="px-4 py-4 sm:px-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <p className="text-sm font-medium text-blue-600 truncate">
                                {company.company || company.html_name}
                              </p>
                            </div>
                            <div className="ml-2 flex-shrink-0 flex">
                              <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                {company.industry || 'No industry'}
                              </p>
                            </div>
                          </div>
                          <div className="mt-2 sm:flex sm:justify-between">
                            <div className="sm:flex">
                              <p className="flex items-center text-sm text-gray-500">
                                {company.sector || 'No sector'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
                <p className="text-gray-700">No companies found matching "{query}".</p>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* We'll add reports search results later */}
      <div className="mb-10">
        <h2 className="text-xl font-semibold mb-3">Reports</h2>
        <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
          <p className="text-gray-700">Report search functionality coming soon.</p>
        </div>
      </div>
    </div>
  )
}