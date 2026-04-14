import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { image, mimeType } = await request.json()
    if (!image) return NextResponse.json({ error: 'No image provided' }, { status: 400 })

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'AI service not configured' }, { status: 500 })

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: 'This is the back cover of a book. Extract ALL text you can read from this image. Return only the text content, preserving paragraphs. Do not add any commentary or explanation.',
              },
              { inlineData: { mimeType: mimeType || 'image/jpeg', data: image } },
            ],
          }],
        }),
      }
    )

    if (!response.ok) {
      const err = await response.text()
      console.error('[scan-book] Gemini error:', err)
      return NextResponse.json({ error: 'AI analysis failed' }, { status: 500 })
    }

    const result = await response.json()
    const text = result?.candidates?.[0]?.content?.parts?.[0]?.text || ''
    if (!text) return NextResponse.json({ error: 'Could not extract text' }, { status: 500 })

    return NextResponse.json({ description: text })
  } catch (err) {
    console.error('[scan-book] error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
