'use client'

import { useState } from 'react'
import { useSupabase } from '@/app/providers'

interface User {
  id: string
  display_name: string | null
  role: string
  created_at: string
}

interface UserRoleManagerProps {
  users: User[]
}

export default function UserRoleManager({ users: initialUsers }: UserRoleManagerProps) {
  const [users, setUsers] = useState(initialUsers)
  const [filteredUsers, setFilteredUsers] = useState(initialUsers)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { supabase } = useSupabase()

  const handleSearch = (term: string) => {
    setSearchTerm(term)
    if (term.trim() === '') {
      setFilteredUsers(users)
    } else {
      const filtered = users.filter(user => 
        user.display_name?.toLowerCase().includes(term.toLowerCase()) ||
        user.id.toLowerCase().includes(term.toLowerCase()) ||
        user.role.toLowerCase().includes(term.toLowerCase())
      )
      setFilteredUsers(filtered)
    }
  }

  const updateUserRole = async (userId: string, newRole: string) => {
    setLoading(userId)
    setError(null)

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ role: newRole })
        .eq('id', userId)

      if (error) throw error

      // Update local state
      const updatedUsers = users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      )
      setUsers(updatedUsers)
      
      // Update filtered users as well
      const updatedFilteredUsers = filteredUsers.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      )
      setFilteredUsers(updatedFilteredUsers)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user role')
    } finally {
      setLoading(null)
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'master_admin':
        return 'bg-purple-100 text-purple-800'
      case 'company_admin':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Search users by name, ID, or role..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      {/* Results count */}
      <div className="text-sm text-gray-600">
        Showing {filteredUsers.length} of {users.length} users
        {searchTerm && (
          <span className="ml-2">
            for "{searchTerm}"
            <button
              onClick={() => handleSearch('')}
              className="ml-2 text-blue-600 hover:text-blue-800"
            >
              Clear
            </button>
          </span>
        )}
      </div>

      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Current Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quick Actions
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                All Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {user.display_name || 'No name set'}
                    </div>
                    <div className="text-sm text-gray-500">
                      ID: {user.id.slice(0, 8)}...
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                    {user.role.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {/* Quick action - most common use case */}
                  {user.role === 'user' && (
                    <button
                      onClick={() => updateUserRole(user.id, 'company_admin')}
                      disabled={loading === user.id}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                    >
                      {loading === user.id ? 'Updating...' : '✓ Make Company Admin'}
                    </button>
                  )}
                  {user.role === 'company_admin' && (
                    <button
                      onClick={() => updateUserRole(user.id, 'user')}
                      disabled={loading === user.id}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      {loading === user.id ? 'Updating...' : '✗ Remove Admin'}
                    </button>
                  )}
                  {user.role === 'master_admin' && (
                    <span className="text-sm text-gray-500">Master Admin</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    {user.role !== 'user' && (
                      <button
                        onClick={() => updateUserRole(user.id, 'user')}
                        disabled={loading === user.id}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                      >
                        User
                      </button>
                    )}
                    {user.role !== 'company_admin' && (
                      <button
                        onClick={() => updateUserRole(user.id, 'company_admin')}
                        disabled={loading === user.id}
                        className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                      >
                        Company Admin
                      </button>
                    )}
                    {user.role !== 'master_admin' && (
                      <button
                        onClick={() => updateUserRole(user.id, 'master_admin')}
                        disabled={loading === user.id}
                        className="text-purple-600 hover:text-purple-900 disabled:opacity-50"
                      >
                        Master Admin
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredUsers.length === 0 && searchTerm && (
        <div className="text-center py-8">
          <p className="text-gray-500">No users found matching "{searchTerm}"</p>
          <button
            onClick={() => handleSearch('')}
            className="mt-2 text-blue-600 hover:text-blue-800"
          >
            Show all users
          </button>
        </div>
      )}
    </div>
  )
}