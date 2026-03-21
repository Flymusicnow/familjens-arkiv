import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
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
}

async function redirectAfterAuth(supabase: Awaited<ReturnType<typeof createClient>>, origin: string) {
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

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)

  // PKCE flow: code param (same browser/device)
  const code = searchParams.get('code')
  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return redirectAfterAuth(supabase, origin)
    }
  }

  // Magic link / OTP flow: token_hash + type (works cross-device)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  if (token_hash && type) {
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.auth.verifyOtp({ token_hash, type: type as any })
    if (!error) {
      return redirectAfterAuth(supabase, origin)
    }
  }

  // Error from Supabase (e.g. otp_expired)
  const error = searchParams.get('error')
  const errorCode = searchParams.get('error_code')
  if (error || errorCode) {
    const params = new URLSearchParams({ error: errorCode || error || 'unknown' })
    return NextResponse.redirect(`${origin}/onboarding?${params}`)
  }

  return NextResponse.redirect(`${origin}/onboarding`)
}
