import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { imageBase64 } = await req.json()
    if (!imageBase64) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      // Graceful fallback: return empty suggestion so user fills in manually
      return NextResponse.json({ suggestion: null, error: 'OCR not configured' })
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: imageBase64.startsWith('/9j') ? 'image/jpeg' : 'image/png',
                  data: imageBase64,
                },
              },
              {
                type: 'text',
                text: `Du är en kvittoanalysator för en svensk familjeapp. Analysera detta kvitto och returnera ENDAST ett JSON-objekt (ingen annan text) med dessa fält:
{
  "description": "företagsnamn eller tjänstnamn (svenska)",
  "amount": nummer i SEK (konvertera från annan valuta om nödvändigt),
  "category": en av: "verktyg", "mat", "boende", "transport", "hälsa", "prenumeration", "övrigt",
  "type": en av: "utgift", "inkomst", "deklaration",
  "status": "klar",
  "note": "kort notering om vad det är"
}
Om du inte kan läsa kvittot, returnera: {"error": "Kan inte läsa kvittot"}`,
              },
            ],
          },
        ],
      }),
    })

    if (!response.ok) {
      return NextResponse.json({ suggestion: null, error: 'OCR request failed' })
    }

    const data = await response.json()
    const text = data.content?.[0]?.text || ''

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ suggestion: null, error: 'Could not parse OCR result' })
    }

    const suggestion = JSON.parse(jsonMatch[0])
    if (suggestion.error) {
      return NextResponse.json({ suggestion: null, error: suggestion.error })
    }

    return NextResponse.json({ suggestion })
  } catch {
    return NextResponse.json({ suggestion: null, error: 'OCR failed' })
  }
}
