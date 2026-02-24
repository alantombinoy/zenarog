const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY

export interface MedicineInsight {
  is_valid: boolean
  image_type: string
  confidence_score: number
  identified: boolean
  medicine: {
    brand_name: string
    generic_name: string[]
    strength: string
    dosage_form: string
    manufacturer: string
    prescription_required: boolean
    drug_category: string
  }
  tablet_details: {
    color: string
    shape: string
    imprint: string
    scored: boolean
    coating: string
  }
  packaging_details: {
    batch_number: string
    manufacturing_date: string
    expiry_date: string
    mrp: string
    strip_size: string
    storage_instructions: string
  }
  medical_info: {
    uses: string[]
    how_it_works: string
    common_side_effects: string[]
    serious_side_effects: string[]
    warnings: string[]
    contraindications: string[]
    drug_interactions: string[]
    food_interactions: string[]
    alcohol_interaction: string
    pregnancy_safety: string
    breastfeeding_safety: string
  }
  insights: {
    summary: string
    clinical_insights: string
    safety_risk_level: 'low' | 'moderate' | 'high'
    addiction_potential: boolean
    common_misuse_cases: string[]
    overdose_risk: string
    when_to_see_doctor: string
    estimated_price_range: string
    is_otc_in_india: boolean
  }
  risk_flags: {
    is_expired: boolean
    is_schedule_h: boolean
    is_high_alert_medicine: boolean
    requires_prescription: boolean
  }
  extracted_text_raw: string
  needs_human_review: boolean
  disclaimer: string
}

const SCHEMA = {
  is_valid: { type: 'boolean', description: 'True only when the uploaded image is medically relevant' },
  image_type: { type: 'string', description: 'Short descriptor like blister pack, tablet close-up, box label' },
  confidence_score: { type: 'number', description: 'Confidence score between 0.0 and 1.0' },
  identified: { type: 'boolean', description: 'Whether medicine was identified' },
  medicine: {
    type: 'object',
    properties: {
      brand_name: { type: 'string' },
      generic_name: { type: 'array', items: { type: 'string' } },
      strength: { type: 'string' },
      dosage_form: { type: 'string' },
      manufacturer: { type: 'string' },
      prescription_required: { type: 'boolean' },
      drug_category: { type: 'string' }
    }
  },
  tablet_details: {
    type: 'object',
    properties: {
      color: { type: 'string' },
      shape: { type: 'string' },
      imprint: { type: 'string' },
      scored: { type: 'boolean' },
      coating: { type: 'string' }
    }
  },
  packaging_details: {
    type: 'object',
    properties: {
      batch_number: { type: 'string' },
      manufacturing_date: { type: 'string' },
      expiry_date: { type: 'string' },
      mrp: { type: 'string' },
      strip_size: { type: 'string' },
      storage_instructions: { type: 'string' }
    }
  },
  medical_info: {
    type: 'object',
    properties: {
      uses: { type: 'array', items: { type: 'string' } },
      how_it_works: { type: 'string' },
      common_side_effects: { type: 'array', items: { type: 'string' } },
      serious_side_effects: { type: 'array', items: { type: 'string' } },
      warnings: { type: 'array', items: { type: 'string' } },
      contraindications: { type: 'array', items: { type: 'string' } },
      drug_interactions: { type: 'array', items: { type: 'string' } },
      food_interactions: { type: 'array', items: { type: 'string' } },
      alcohol_interaction: { type: 'string' },
      pregnancy_safety: { type: 'string' },
      breastfeeding_safety: { type: 'string' }
    }
  },
  insights: {
    type: 'object',
    properties: {
      summary: { type: 'string' },
      clinical_insights: { type: 'string' },
      safety_risk_level: { type: 'string', enum: ['low', 'moderate', 'high'] },
      addiction_potential: { type: 'boolean' },
      common_misuse_cases: { type: 'array', items: { type: 'string' } },
      overdose_risk: { type: 'string' },
      when_to_see_doctor: { type: 'string' },
      estimated_price_range: { type: 'string' },
      is_otc_in_india: { type: 'boolean' }
    }
  },
  risk_flags: {
    type: 'object',
    properties: {
      is_expired: { type: 'boolean' },
      is_schedule_h: { type: 'boolean' },
      is_high_alert_medicine: { type: 'boolean' },
      requires_prescription: { type: 'boolean' }
    }
  },
  extracted_text_raw: { type: 'string' },
  needs_human_review: { type: 'boolean' },
  disclaimer: { type: 'string' }
}

export async function analyzeMedicationImage(base64Image: string): Promise<MedicineInsight> {
  const prompt = `Analyze this medicine image and return JSON with:
- is_valid: true if image shows medicine
- identified: true if you can identify the medicine
- medicine: {brand_name, generic_name[], strength, dosage_form, manufacturer}
- tablet_details: {color, shape, imprint, scored, coating}
- packaging_details: {batch_number, manufacturing_date, expiry_date, mrp}
- medical_info: {uses[], common_side_effects[], serious_side_effects[], warnings[]}
- insights: {summary, safety_risk_level: "low"|"moderate"|"high", overdose_risk}
- risk_flags: {is_expired, is_schedule_h, requires_prescription}
- disclaimer: "This is AI-generated info, consult a doctor"

If medicine name unclear, guess based on imprint, color, shape. Prioritize common Indian brands. Return valid JSON only.`

  try {
    console.log('Calling OpenRouter API...')
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
          model: 'qwen/qwen2.5-vl-32b-instruct',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                { type: 'image_url', image_url: { url: base64Image } }
              ]
            }
          ],
          max_tokens: 1200,
          temperature: 0.3
        })
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenRouter error:', response.status, errorText)
      throw new Error(`API error: ${response.status} - ${errorText.slice(0, 100)}`)
    }

    const data = await response.json()
    console.log('OpenRouter response:', data)
    const textResponse = data.choices?.[0]?.message?.content || ''
    console.log('AI response text:', textResponse.slice(0, 200))
    
    try {
      const jsonMatch = textResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        console.log('Parsing JSON...')
        const parsed = JSON.parse(jsonMatch[0])
        console.log('Parsed:', parsed)
        
        const defaultInsight: MedicineInsight = {
          is_valid: parsed.is_valid ?? false,
          image_type: parsed.image_type ?? '',
          confidence_score: parsed.confidence_score ?? 0,
          identified: parsed.identified ?? false,
          medicine: parsed.medicine ?? {},
          tablet_details: parsed.tablet_details ?? {},
          packaging_details: parsed.packaging_details ?? {},
          medical_info: parsed.medical_info ?? {},
          insights: parsed.insights ?? {},
          risk_flags: parsed.risk_flags ?? {},
          extracted_text_raw: parsed.extracted_text_raw ?? '',
          needs_human_review: parsed.needs_human_review ?? false,
          disclaimer: parsed.disclaimer ?? 'This information is AI-generated and not medical advice.'
        }
        
        return defaultInsight
      }
    } catch {
      // Parse failed
    }
    
    return getDefaultInsight()
  } catch (err: any) {
    throw new Error(`Analysis failed: ${err.message}`)
  }
}

function getDefaultInsight(): MedicineInsight {
  return {
    is_valid: false,
    image_type: '',
    confidence_score: 0,
    identified: false,
    medicine: {
      brand_name: 'Unknown',
      generic_name: [],
      strength: '',
      dosage_form: '',
      manufacturer: '',
      prescription_required: false,
      drug_category: ''
    },
    tablet_details: {
      color: '',
      shape: '',
      imprint: '',
      scored: false,
      coating: ''
    },
    packaging_details: {
      batch_number: '',
      manufacturing_date: '',
      expiry_date: '',
      mrp: '',
      strip_size: '',
      storage_instructions: ''
    },
    medical_info: {
      uses: [],
      how_it_works: '',
      common_side_effects: [],
      serious_side_effects: [],
      warnings: [],
      contraindications: [],
      drug_interactions: [],
      food_interactions: [],
      alcohol_interaction: '',
      pregnancy_safety: '',
      breastfeeding_safety: ''
    },
    insights: {
      summary: '',
      clinical_insights: '',
      safety_risk_level: 'low',
      addiction_potential: false,
      common_misuse_cases: [],
      overdose_risk: '',
      when_to_see_doctor: '',
      estimated_price_range: '',
      is_otc_in_india: false
    },
    risk_flags: {
      is_expired: false,
      is_schedule_h: false,
      is_high_alert_medicine: false,
      requires_prescription: false
    },
    extracted_text_raw: '',
    needs_human_review: true,
    disclaimer: 'This information is AI-generated and not medical advice. Consult a qualified healthcare professional before use.'
  }
}
