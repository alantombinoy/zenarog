const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY

export interface AIResult {
  drugName: string
  dosage: string
  manufacturer: string
  activeIngredients: string
  warnings: string
  rawResponse: string
}

export async function analyzeMedicationImage(base64Image: string): Promise<AIResult> {
  const prompt = `Extract medication info from this image. 
Respond ONLY with valid JSON:
{"drugName": "name", "dosage": "e.g. 500mg", "manufacturer": "company", "activeIngredients": "ingredients", "warnings": "any warnings"}`

  try {
    const response = await fetch(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Zenarog'
        },
        body: JSON.stringify({
          model: 'nvidia/nemotron-nano-12b-v2-vl:free',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                { type: 'image_url', image_url: { url: base64Image } }
              ]
            }
          ],
          max_tokens: 500
        })
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    const textResponse = data.choices?.[0]?.message?.content || ''
    
    try {
      const jsonMatch = textResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          drugName: parsed.drugName || 'Unknown',
          dosage: parsed.dosage || 'Unknown',
          manufacturer: parsed.manufacturer || 'Unknown',
          activeIngredients: parsed.activeIngredients || 'Unknown',
          warnings: parsed.warnings || '',
          rawResponse: textResponse
        }
      }
    } catch {
      // JSON parse failed
    }
    
    return {
      drugName: 'Unknown',
      dosage: 'Unknown',
      manufacturer: 'Unknown',
      activeIngredients: 'Unknown',
      warnings: '',
      rawResponse: textResponse
    }
  } catch (err: any) {
    throw new Error(`Analysis failed: ${err.message}`)
  }
}
