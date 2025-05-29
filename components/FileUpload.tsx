'use client'

import { useState } from 'react'
import { useSupabase } from '@/app/providers'

interface FileUploadProps {
  onUploadComplete: (url: string, fileName: string) => void
  disabled?: boolean
}

export default function FileUpload({ onUploadComplete, disabled = false }: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const { supabase } = useSupabase()

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)
      setUploadProgress(0)

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select a file to upload.')
      }

      const file = event.target.files[0]
      
      // Validate file type
      if (file.type !== 'application/pdf') {
        throw new Error('Only PDF files are allowed.')
      }

      // Validate file size (e.g., max 50MB)
      const maxSize = 50 * 1024 * 1024 // 50MB in bytes
      if (file.size > maxSize) {
        throw new Error('File size must be less than 50MB.')
      }

      // Create a unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `reports/${fileName}`

      // Upload file to Supabase Storage
      const { error: uploadError, data } = await supabase.storage
        .from('reports')
        .upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('reports')
        .getPublicUrl(filePath)

      setUploadProgress(100)
      onUploadComplete(publicUrl, file.name)
      
    } catch (error) {
      console.error('Error uploading file:', error)
      alert(error instanceof Error ? error.message : 'Error uploading file')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center w-full">
        <label 
          htmlFor="file-upload" 
          className={`flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 ${disabled || uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
            </svg>
            <p className="mb-2 text-sm text-gray-500">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500">PDF files only (MAX. 50MB)</p>
          </div>
          <input 
            id="file-upload" 
            type="file" 
            className="hidden" 
            accept=".pdf"
            onChange={handleFileUpload}
            disabled={disabled || uploading}
          />
        </label>
      </div>
      
      {uploading && (
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
            style={{ width: `${uploadProgress}%` }}
          ></div>
        </div>
      )}
      
      {uploading && (
        <p className="text-sm text-gray-600 text-center">
          Uploading PDF... {uploadProgress}%
        </p>
      )}
    </div>
  )
}