import { useState, useRef, useEffect } from 'react'
import { addDoc, collection } from 'firebase/firestore'
import { db, auth } from '../../services/firebase'
import { searchDrug, DrugInfo } from '../../services/drugApi'
import { analyzeMedicationImage } from '../../services/openRouter'
import { 
  ScanLine, Upload, Loader2, AlertCircle, Pill, Activity, FileText, 
  ShieldAlert, CheckCircle, XCircle, Info, ArrowRight, RefreshCw
} from 'lucide-react'

interface ScanResult {
  id: string
  imageUrl: string
  extractedText: string
  drugName: string
  drugInfo: DrugInfo | null
  scannedAt: Date
  verified: boolean
  aiData?: {
    dosage: string
    manufacturer: string
    activeIngredients: string
    warnings: string
  }
}

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: 'easeOut' }
}

export default function MedScanner() {
  const [scanning, setScanning] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [extractedText, setExtractedText] = useState('')
  const [drugInfo, setDrugInfo] = useState<DrugInfo | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [lastScan, setLastScan] = useState<ScanResult | null>(null)
  const [aiData, setAiData] = useState<ScanResult['aiData'] | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [verified, setVerified] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64 = reader.result as string
        setImagePreview(base64)
        setShowDetails(false)
        await processImage(base64, file)
      }
      reader.readAsDataURL(file)
    }
  }

  const processImage = async (base64Image: string, _file: File) => {
    setScanning(true)
    setError('')
    setDrugInfo(null)
    setExtractedText('')
    setAiData(null)
    setVerified(false)

    try {
      setLoading(true)
      
      const result = await analyzeMedicationImage(base64Image)
      
      setAiData({
        dosage: result.dosage,
        manufacturer: result.manufacturer,
        activeIngredients: result.activeIngredients,
        warnings: result.warnings
      })

      let fdaVerified = false
      let finalDrugInfo: DrugInfo | null = null
      
      try {
        const fdaResult = await searchDrug(result.drugName)
        
        if (fdaResult && fdaResult.results && fdaResult.results.length > 0) {
          finalDrugInfo = fdaResult.results[0]
          fdaVerified = true
          setVerified(true)
        }
      } catch (fdaError) {
        console.log('FDA lookup failed, using AI data')
      }

      if (!finalDrugInfo) {
        finalDrugInfo = {
          brand_name: [result.drugName],
          generic_name: [result.activeIngredients.split(',')[0]?.trim() || 'Unknown'],
          manufacturer_name: [result.manufacturer],
          product_type: ['Tablet'],
          dosage_form: ['Oral Tablet'],
          route: ['Oral'],
          active_ingredients: result.activeIngredients.split(',').map(ing => ({ 
            name: ing.trim(), 
            strength: result.dosage 
          })),
          purpose: ['Treatment as directed'],
          indications_and_usage: ['Consult your healthcare provider.'],
          warnings: result.warnings ? [result.warnings] : ['Follow dosage instructions'],
          adverse_reactions: ['Consult package insert.'],
          drug_interactions: ['Consult your doctor.']
        }
      }

      setDrugInfo(finalDrugInfo)
      setExtractedText(`Drug: ${result.drugName}\nDosage: ${result.dosage}\nManufacturer: ${result.manufacturer}`)
      
      setTimeout(() => setShowDetails(true), 300)

      const scanResult: ScanResult = {
        id: Date.now().toString(),
        imageUrl: base64Image,
        extractedText: `Drug: ${result.drugName}\nDosage: ${result.dosage}`,
        drugName: result.drugName,
        drugInfo: finalDrugInfo,
        scannedAt: new Date(),
        verified: fdaVerified,
        aiData: {
          dosage: result.dosage,
          manufacturer: result.manufacturer,
          activeIngredients: result.activeIngredients,
          warnings: result.warnings
        }
      }
      setLastScan(scanResult)

      if (auth.currentUser && db && typeof db === 'object' && 'collection' in db) {
        try {
          await addDoc(collection(db, 'medications'), {
            userId: auth.currentUser.uid,
            ...scanResult,
            scannedAt: new Date()
          })
        } catch (e) {
          console.log('Saving skipped')
        }
      }
    } catch (err: any) {
      console.error('Error:', err)
      setError(err.message || 'Failed to process image. Please try again.')
    } finally {
      setScanning(false)
      setLoading(false)
    }
  }

  const resetScanner = () => {
    setImagePreview(null)
    setExtractedText('')
    setDrugInfo(null)
    setError('')
    setLastScan(null)
    setAiData(null)
    setVerified(false)
    setShowDetails(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div style={{ 
      opacity: fadeIn.animate.opacity,
      transition: 'opacity 0.3s ease'
    }}>
      <div className="page-header">
        <h1 className="page-title" style={{ 
          background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          MedScan
        </h1>
        <p className="page-subtitle">Scan medication strips for instant analysis</p>
      </div>

      <div className="grid-2" style={{ alignItems: 'start', gap: '2rem' }}>
        <div style={{ 
          transition: 'transform 0.3s ease, opacity 0.3s ease',
          transform: showDetails ? 'scale(0.95)' : 'scale(1)'
        }}>
          {!imagePreview ? (
            <div 
              className="upload-zone"
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed #06b6d4',
                background: 'linear-gradient(135deg, #f0fdfa, #cffafe)',
                borderRadius: '1rem',
                padding: '3rem 2rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              <Upload style={{ width: 48, height: 48, color: '#06b6d4', margin: '0 auto 1rem' }} />
              <p style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#134e4a' }}>
                Upload Medication Strip
              </p>
              <p style={{ fontSize: '0.875rem', color: '#5eead4' }}>
                Click or drag and drop
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                style={{ display: 'none' }}
              />
            </div>
          ) : (
            <div className="card" style={{ 
              overflow: 'hidden',
              transition: 'all 0.3s ease'
            }}>
              <div style={{ position: 'relative', borderRadius: '0.5rem', overflow: 'hidden' }}>
                <img 
                  src={imagePreview} 
                  alt="Scanned medication" 
                  style={{ 
                    width: '100%', 
                    maxHeight: '280px',
                    objectFit: 'cover',
                    transition: 'transform 0.3s ease'
                  }} 
                />
                {scanning && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.95), rgba(8, 145, 178, 0.95))',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    animation: 'pulse 2s ease-in-out infinite'
                  }}>
                    <style>{`
                      @keyframes pulse {
                        0%, 100% { background: linear-gradient(135deg, rgba(6, 182, 212, 0.9), rgba(8, 145, 178, 0.9)); }
                        50% { background: linear-gradient(135deg, rgba(6, 182, 212, 1), rgba(8, 145, 178, 1)); }
                      }
                      @keyframes float {
                        0%, 100% { transform: translateY(0); }
                        50% { transform: translateY(-10px); }
                      }
                    `}</style>
                    <div style={{ animation: 'float 2s ease-in-out infinite' }}>
                      <ScanLine size={64} style={{ marginBottom: '1rem' }} />
                    </div>
                    <p style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.5rem' }}>Analyzing Medication</p>
                    <p style={{ fontSize: '0.875rem', opacity: 0.9 }}>AI is reading your medication strip...</p>
                    <div style={{ 
                      marginTop: '1.5rem', 
                      width: '200px', 
                      height: '4px', 
                      background: 'rgba(255,255,255,0.3)', 
                      borderRadius: '2px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: '50%',
                        height: '100%',
                        background: 'white',
                        borderRadius: '2px',
                        animation: 'loading 1.5s ease-in-out infinite'
                      }}>
                        <style>{`
                          @keyframes loading {
                            0% { transform: translateX(-100%); }
                            100% { transform: translateX(250%); }
                          }
                        `}</style>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <button 
                className="btn btn-secondary" 
                onClick={resetScanner}
                style={{ 
                  marginTop: '1rem', 
                  width: '100%',
                  background: '#f0fdfa',
                  color: '#06b6d4',
                  border: '1px solid #06b6d4'
                }}
              >
                <RefreshCw size={16} /> Scan Another
              </button>
            </div>
          )}

          {error && (
            <div style={{ 
              marginTop: '1rem',
              padding: '1rem', 
              background: '#fef2f2', 
              color: '#dc2626',
              borderRadius: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <AlertCircle size={20} />
              {error}
            </div>
          )}
        </div>

        <div style={{
          transition: 'opacity 0.4s ease, transform 0.4s ease',
          opacity: showDetails ? 1 : 0.5,
          transform: showDetails ? 'translateX(0)' : 'translateX(-10px)'
        }}>
          {!imagePreview && (
            <div className="card" style={{ 
              textAlign: 'center', 
              padding: '3rem 2rem', 
              color: '#9ca3af',
              background: '#f0fdfa'
            }}>
              <ScanLine size={48} style={{ margin: '0 auto 1rem', opacity: 0.5, color: '#06b6d4' }} />
              <p>Upload a photo to get started</p>
            </div>
          )}

          {loading && !scanning && (
            <div className="card" style={{ 
              textAlign: 'center', 
              padding: '3rem',
              background: '#f0fdfa'
            }}>
              <div style={{ 
                width: '60px', 
                height: '60px', 
                border: '3px solid #cffafe',
                borderTopColor: '#06b6d4',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 1rem'
              }}>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
              <p style={{ color: '#134e4a', fontWeight: 500 }}>Verifying with FDA...</p>
            </div>
          )}

          {drugInfo && showDetails && (
            <div className="card" style={{ 
              animation: 'slideIn 0.4s ease-out',
              background: 'white',
              border: '1px solid #cffafe'
            }}>
              <style>{`
                @keyframes slideIn {
                  from { opacity: 0; transform: translateY(20px); }
                  to { opacity: 1; transform: translateY(0); }
                }
              `}</style>
              
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                marginBottom: '1.5rem',
                paddingBottom: '1rem',
                borderBottom: '1px solid #f0fdfa'
              }}>
                <div>
                  <h2 style={{ 
                    fontSize: '1.5rem', 
                    fontWeight: 700, 
                    color: '#134e4a',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    {drugInfo.brand_name?.[0] || 'Unknown'}
                    {verified && (
                      <CheckCircle size={20} style={{ color: '#10b981' }} />
                    )}
                  </h2>
                  <p style={{ color: '#5eead4', fontSize: '0.875rem' }}>
                    {drugInfo.generic_name?.[0]}
                  </p>
                </div>
                {verified && (
                  <span style={{
                    background: '#d1fae5',
                    color: '#059669',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: 600
                  }}>
                    ✓ FDA Verified
                  </span>
                )}
              </div>

              <div style={{ display: 'grid', gap: '1rem' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.75rem',
                  padding: '0.75rem',
                  background: '#f0fdfa',
                  borderRadius: '0.5rem'
                }}>
                  <Pill size={20} style={{ color: '#06b6d4' }} />
                  <div>
                    <p style={{ fontSize: '0.7rem', color: '#5eead4', textTransform: 'uppercase' }}>Dosage</p>
                    <p style={{ fontWeight: 600, color: '#134e4a' }}>
                      {aiData?.dosage || drugInfo.dosage_form?.[0] || 'See packaging'}
                    </p>
                  </div>
                </div>

                {drugInfo.manufacturer_name?.[0] && (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.75rem',
                    padding: '0.75rem',
                    background: '#f0fdfa',
                    borderRadius: '0.5rem'
                  }}>
                    <Activity size={20} style={{ color: '#06b6d4' }} />
                    <div>
                      <p style={{ fontSize: '0.7rem', color: '#5eead4', textTransform: 'uppercase' }}>Manufacturer</p>
                      <p style={{ fontWeight: 600, color: '#134e4a' }}>
                        {drugInfo.manufacturer_name[0]}
                      </p>
                    </div>
                  </div>
                )}

                {drugInfo.warnings && drugInfo.warnings.length > 0 && (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    gap: '0.75rem',
                    padding: '0.75rem',
                    background: '#fef3c7',
                    borderRadius: '0.5rem',
                    border: '1px solid #fcd34d'
                  }}>
                    <ShieldAlert size={20} style={{ color: '#d97706', flexShrink: 0 }} />
                    <div>
                      <p style={{ fontSize: '0.7rem', color: '#b45309', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Important Warnings</p>
                      <p style={{ fontSize: '0.875rem', color: '#92400e' }}>
                        {drugInfo.warnings[0]?.substring(0, 150)}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => setShowDetails(!showDetails)}
                style={{
                  marginTop: '1rem',
                  width: '100%',
                  padding: '0.75rem',
                  background: 'transparent',
                  border: '1px solid #06b6d4',
                  color: '#06b6d4',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s ease'
                }}
              >
                {showDetails ? 'Show Less' : 'View More Details'}
                <ArrowRight size={16} style={{ transition: 'transform 0.2s' }} />
              </button>

              {showDetails && (
                <div style={{ 
                  marginTop: '1rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid #f0fdfa',
                  animation: 'fadeIn 0.3s ease'
                }}>
                  <style>{`
                    @keyframes fadeIn {
                      from { opacity: 0; }
                      to { opacity: 1; }
                    }
                  `}</style>
                  
                  {drugInfo.indications_and_usage && drugInfo.indications_and_usage.length > 0 && (
                    <div style={{ marginBottom: '1rem' }}>
                      <h4 style={{ fontSize: '0.75rem', color: '#5eead4', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                        Uses
                      </h4>
                      <p style={{ fontSize: '0.875rem', color: '#374151' }}>
                        {drugInfo.indications_and_usage[0]?.substring(0, 200)}
                      </p>
                    </div>
                  )}

                  {drugInfo.adverse_reactions && drugInfo.adverse_reactions.length > 0 && (
                    <div style={{ marginBottom: '1rem' }}>
                      <h4 style={{ fontSize: '0.75rem', color: '#5eead4', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                        Possible Side Effects
                      </h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {drugInfo.adverse_reactions.slice(0, 5).map((r, i) => (
                          <span key={i} style={{
                            padding: '0.25rem 0.5rem',
                            background: '#fef3c7',
                            color: '#92400e',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem'
                          }}>
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {drugInfo.drug_interactions && drugInfo.drug_interactions.length > 0 && (
                    <div>
                      <h4 style={{ fontSize: '0.75rem', color: '#5eead4', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                        Drug Interactions
                      </h4>
                      <p style={{ fontSize: '0.875rem', color: '#374151' }}>
                        {drugInfo.drug_interactions[0]?.substring(0, 150)}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div style={{ 
                marginTop: '1.5rem', 
                padding: '0.75rem', 
                background: '#f0fdfa', 
                borderRadius: '0.5rem',
                fontSize: '0.75rem',
                color: '#5eead4',
                textAlign: 'center'
              }}>
                <Info size={14} style={{ display: 'inline', marginRight: '0.25rem' }} />
                Consult a healthcare professional before taking any medication.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
