import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Check if user has a workspace; if not, send to onboarding choose step
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: member } = await supabase
          .from('family_members')
          .select('workspace_id')
          .eq('user_id', user.id)
          .maybeSingle()

        if (!member?.workspace_id) {
          return NextResponse.redirect(`${origin}/onboarding?step=choose`)
        }
      }
      return NextResponse.redirect(`${origin}/hem`)
    }
  }

  // Handle Supabase error params (e.g. otp_expired)
  const error = searchParams.get('error')
  const errorCode = searchParams.get('error_code')
  if (error || errorCode) {
    const params = new URLSearchParams({ error: errorCode || error || 'unknown' })
    return NextResponse.redirect(`${origin}/onboarding?${params}`)
  }

  return NextResponse.redirect(`${origin}/onboarding`)
}
