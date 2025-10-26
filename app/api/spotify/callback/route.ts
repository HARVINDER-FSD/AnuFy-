import { NextRequest, NextResponse } from 'next/server'

const SPOTIFY_CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET
const REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL 
  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/spotify/callback`
  : 'http://localhost:3000/api/spotify/callback'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  if (!code) {
    return NextResponse.redirect(new URL('/?error=spotify_auth_failed', request.url))
  }

  try {
    // Exchange code for tokens
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: REDIRECT_URI
      })
    })

    if (!response.ok) {
      throw new Error('Token exchange failed')
    }

    const tokens = await response.json()

    // Redirect to app with tokens in URL (will be stored in localStorage)
    const redirectUrl = new URL('/', request.url)
    redirectUrl.searchParams.set('spotify_tokens', Buffer.from(JSON.stringify(tokens)).toString('base64'))
    
    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    console.error('Spotify callback error:', error)
    return NextResponse.redirect(new URL('/?error=spotify_auth_failed', request.url))
  }
}
