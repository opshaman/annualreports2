'use client'

import { useSupabase } from '@/app/providers'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import InterestSelector from '@/components/InterestSelector'

export default function ProfilePage() {
  const { user, loading } = useSupabase()
  const [profile, setProfile] = useState<any>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [requestLoading, setRequestLoading] = useState(false)
  const [requestSent, setRequestSent] = useState(false)
  const [interests, setInterests] = useState<string[]>([])
  const [interestsLoading, setInterestsLoading] = useState(false)
  const { supabase } = useSupabase()

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        setProfile(data)
        setInterests(data?.interests || [])
        setProfileLoading(false)
      }
    }

    fetchProfile()
  }, [user, supabase])

  const handleInterestsChange = async (newInterests: string[]) => {
    setInterests(newInterests)
    setInterestsLoading(true)
    
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ interests: newInterests })
        .eq('id', user?.id)

      if (error) {
        throw error
      }
    } catch (error) {
      console.error('Error updating interests:', error)
      alert('Failed to update interests. Please try again.')
      // Revert to previous state
      setInterests(profile?.interests || [])
    } finally {
      setInterestsLoading(false)
    }
  }

  const handleAccessRequest = async () => {
    setRequestLoading(true)
    
    try {
      const response = await fetch('/api/request-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail: user?.email,
          userId: user?.id,
          displayName: profile?.display_name || user?.email,
        }),
      })

      if (response.ok) {
        setRequestSent(true)
      } else {
        throw new Error('Failed to send request')
      }
    } catch (error) {
      console.error('Error sending access request:', error)
      alert('Failed to send request. Please try again.')
    } finally {
      setRequestLoading(false)
    }
  }

  if (loading || profileLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center">
        <p className="mb-4">You need to be logged in to view your profile.</p>
        <Link href="/auth/login" className="text-blue-600 hover:text-blue-500">
          Log in
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">User Profile</h1>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
            </div>
            
            <div>
              <dt className="text-sm font-medium text-gray-500">Account Type</dt>
              <dd className="mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  profile?.role === 'master_admin' 
                    ? 'bg-purple-100 text-purple-800'
                    : profile?.role === 'company_admin'
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {profile?.role === 'master_admin' && 'Master Admin'}
                  {profile?.role === 'company_admin' && 'Company Admin'}
                  {profile?.role === 'user' && 'User'}
                  {!profile?.role && 'Unknown'}
                </span>
              </dd>
            </div>
            
            <div>
              <dt className="text-sm font-medium text-gray-500">Member Since</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(user.created_at).toLocaleDateString()}
              </dd>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Account Actions</h2>
          
          <div className="space-y-3">
            {(profile?.role === 'company_admin' || profile?.role === 'master_admin') && (
              <Link
                href="/reports/upload"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Upload Report
              </Link>
            )}
            
            {profile?.role === 'master_admin' && (
              <Link
                href="/admin"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 ml-3"
              >
                Admin Panel
              </Link>
            )}
            
            {profile?.role === 'user' && (
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <div className="flex">
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        Need to upload company reports?
                      </h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>
                          If you represent a company and need to upload annual reports, 
                          you can request company admin access below.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {requestSent ? (
                  <div className="bg-green-50 border border-green-200 rounded-md p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-green-800">
                          Request Sent Successfully!
                        </h3>
                        <div className="mt-2 text-sm text-green-700">
                          <p>
                            Your request for company admin access has been sent. 
                            You'll receive an email confirmation once it's been reviewed.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handleAccessRequest}
                    disabled={requestLoading}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {requestLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending Request...
                      </>
                    ) : (
                      'Request Company Profile Access'
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Interests Section */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium text-gray-900">Your Interests</h2>
            {interestsLoading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            )}
          </div>
          
          <InterestSelector
            selectedInterests={interests}
            onInterestsChange={handleInterestsChange}
            disabled={interestsLoading}
          />
          
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Personalized Feed
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    Your interests help us show you the most relevant insights from annual reports. 
                    You can change these anytime, and we'll automatically update your feed.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}