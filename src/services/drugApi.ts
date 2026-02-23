import axios from 'axios'

const OPENFDA_BASE_URL = 'https://api.fda.gov/drug'

export interface DrugInfo {
  brand_name: string[]
  generic_name: string[]
  manufacturer_name: string[]
  product_type: string[]
  dosage_form: string[]
  route: string[]
  active_ingredients: { name: string; strength: string }[]
  purpose: string[]
  indications_and_usage: string[]
  warnings: string[]
  adverse_reactions: string[]
  drug_interactions: string[]
}

export interface DrugSearchResult {
  results: DrugInfo[]
}

export async function searchDrug(drugName: string): Promise<DrugSearchResult | null> {
  if (!drugName || drugName === 'Unknown') return null

  const cleanName = drugName.trim().replace(/[^\w\s]/g, '')
  
  const searchQueries = [
    `openfda.brand_name:"${cleanName}"`,
    `openfda.generic_name:"${cleanName}"`,
    `openfda.brand_name:${cleanName}*`,
    `openfda.generic_name:${cleanName}*`
  ]

  for (const query of searchQueries) {
    try {
      const response = await axios.get(
        `${OPENFDA_BASE_URL}/label.json`,
        {
          params: {
            search: query,
            limit: 3
          }
        }
      )
      if (response.data?.results?.length > 0) {
        return response.data
      }
    } catch (error) {
      continue
    }
  }

  return null
}

export async function searchDrugByGeneric(genericName: string): Promise<DrugSearchResult | null> {
  try {
    const response = await axios.get(
      `${OPENFDA_BASE_URL}/label.json`,
      {
        params: {
          search: `openfda.generic_name:"${genericName}"`,
          limit: 5
        }
      }
    )
    return response.data
  } catch (error) {
    console.error('Error searching drug by generic:', error)
    return null
  }
}

export function extractDrugName(text: string): string {
  const lines = text.split('\n').filter(line => line.trim())
  
  const patterns = [
    /([A-Z][A-Za-z\s]+(?:\d+(?:\.\d+)?(?:mg|mcg|g|ml|IU|%)?))/,
    /^([A-Za-z]+)\s+\d+/m,
  ]

  for (const line of lines.slice(0, 5)) {
    const cleaned = line.trim().toLowerCase()
    if (cleaned.length > 2 && cleaned.length < 50) {
      const words = cleaned.split(/\s+/)
      if (words.length <= 4) {
        return words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
      }
    }
  }
  
  return text.split('\n')[0]?.trim() || ''
}
