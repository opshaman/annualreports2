// app/api/insights/preferences/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/app/lib/supabase'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user preferences
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('interests')
      .eq('id', user.id)
      .single()

    if (profileError) {
      throw profileError
    }

    return NextResponse.json({
      success: true,
      interests: profile?.interests || []
    })

  } catch (error) {
    console.error('Preferences error:', error)
    return NextResponse.json(
      { error: 'Failed to get preferences' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { interests } = await request.json()

    if (!Array.isArray(interests)) {
      return NextResponse.json(
        { error: 'Interests must be an array' },
        { status: 400 }
      )
    }

    // Update user preferences
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ interests })
      .eq('id', user.id)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({
      success: true,
      interests
    })

  } catch (error) {
    console.error('Update preferences error:', error)
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    )
  }
}