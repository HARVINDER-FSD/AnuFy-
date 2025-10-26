import { NextRequest, NextResponse } from 'next/server'

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')

  if (!query) {
    return NextResponse.json({ error: 'Query required' }, { status: 400 })
  }

  try {
    const response = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&limit=20`
    )
    const data = await response.json()

    const songs = data.results
      ?.filter((track: any) => track.previewUrl)
      .map((track: any) => ({
        id: track.trackId.toString(),
        title: track.trackName,
        artist: track.artistName,
        duration: Math.floor(track.trackTimeMillis / 1000),
        durationFormatted: formatDuration(track.trackTimeMillis / 1000),
        artwork: track.artworkUrl100.replace('100x100', '300x300'),
        previewUrl: track.previewUrl,
        source: 'itunes'
      })) || []

    console.log(`iTunes: ${songs.length} songs found`)
    return NextResponse.json({ songs })
  } catch (error) {
    console.error('iTunes search error:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
