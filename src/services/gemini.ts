import Tesseract from 'tesseract.js'

export interface OCRResult {
  drugName: string
  dosage: string
  manufacturer: string
  activeIngredients: string
  warnings: string
  rawText: string
}

export async function analyzeMedicationImage(base64Image: string): Promise<OCRResult> {
  try {
    const result = await Tesseract.recognize(
      base64Image,
      'eng',
      {
        logger: (m) => console.log(m)
      }
    )

    const rawText = result.data.text
    
    if (!rawText || rawText.trim().length < 5) {
      throw new Error('No text detected')
    }

    console.log('Raw OCR Text:', rawText)
    return parseOCRResult(rawText)
  } catch (err: any) {
    console.error('OCR Error:', err)
    throw new Error(`OCR failed: ${err.message}`)
  }
}

function parseOCRResult(rawText: string): OCRResult {
  const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 1)
  const upperText = rawText.toUpperCase()
  
  const dosagePatterns = [
    /\b\d+\s*mg\b/gi,
    /\b\d+\s*mcg\b/gi,
    /\b\d+\s*g\b/gi,
    /\b\d+\s*ml\b/gi,
    /\b\d+\s*IU\b/gi
  ]
  
  let dosage = ''
  for (const pattern of dosagePatterns) {
    const match = upperText.match(pattern)
    if (match) {
      dosage = match[0]
      break
    }
  }

  const mfgPatterns = [
    /MFG[:\s]*([A-Za-z\s]{3,25})/gi,
    /MANUFACTURER[:\s]*([A-Za-z\s]{3,25})/gi
  ]
  
  let manufacturer = ''
  for (const pattern of mfgPatterns) {
    const match = upperText.match(pattern)
    if (match) {
      manufacturer = match[1] || match[0]
      break
    }
  }

  const warningPatterns = [
    /STORE[:\s]*[^.\n]*/gi,
    /WARNING[:\s]*[^.\n]*/gi,
    /CAUTION[:\s]*[^.\n]*/gi,
    /EXPIRY[:\s]*[^.\n]*/gi
  ]
  
  let warnings = ''
  for (const pattern of warningPatterns) {
    const match = upperText.match(pattern)
    if (match) {
      warnings = match.slice(0, 3).join('. ')
      break
    }
  }

  const commonDrugs = [
    'PARACETAMOL', 'ACETAMINOPHEN', 'IBUPROFEN', 'ASPIRIN', 'AMOXICILLIN',
    'CIPROFLOXACIN', 'AZITHROMYCIN', 'METFORMIN', 'ATORVASTATIN', 'AMLODIPINE',
    'LOSARTAN', 'OMEPRAZOOL', 'PANTOPRAZOLE', 'CETIRIZINE', 'LORATADINE',
    'DICLOFENAC', 'TRAMADOL', 'AMITRIPTYLINE', 'METRONIDAZOLE', 'CIPLA'
  ]

  let drugName = ''
  
  for (const line of lines) {
    const upperLine = line.toUpperCase()
    for (const drug of commonDrugs) {
      if (upperLine.includes(drug)) {
        drugName = drug
        break
      }
    }
    if (drugName) break
  }

  if (!drugName) {
    for (const line of lines.slice(0, 8)) {
      const cleaned = line.replace(/[\d\-\.\,\(\)\[\]]/g, '').trim()
      if (cleaned.length > 3 && cleaned.length < 35 && /^[A-Z\s]+$/.test(cleaned) && !cleaned.includes('MG')) {
        drugName = cleaned
        break
      }
    }
  }

  return {
    drugName: drugName || lines[0] || 'Unknown',
    dosage: dosage || 'See packaging',
    manufacturer: manufacturer || 'See packaging',
    activeIngredients: drugName || 'See packaging',
    warnings: warnings || 'Follow dosage instructions',
    rawText
  }
}
