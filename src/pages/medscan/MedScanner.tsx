import { useState, useRef } from 'react'
import { collection, addDoc } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { auth } from '../../services/firebase'
import { searchDrug, DrugInfo, extractDrugName } from '../../services/drugApi'
import { ScanLine, Upload, Loader2, AlertCircle, Pill, Activity, FileText, ShieldAlert } from 'lucide-react'

interface ScanResult {
  id: string
  imageUrl: string
  extractedText: string
  drugName: string
  drugInfo: DrugInfo | null
  scannedAt: Date
}

export default function MedScanner() {
  const [scanning, setScanning] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [extractedText, setExtractedText] = useState('')
  const [drugInfo, setDrugInfo] = useState<DrugInfo | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [lastScan, setLastScan] = useState<ScanResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
        processImage(file)
      }
      reader.readAsDataURL(file)
    }
  }

  const processImage = async (file: File) => {
    setScanning(true)
    setError('')
    setDrugInfo(null)
    setExtractedText('')

    try {
      const mockText = `PARACETAMOL 500mg
Acetaminophen
Mfg: Cipla Ltd
Expiry: 12/2026
Store below 25°C

Each tablet contains:
Paracetamol 500mg

Read package insert before use`

      setExtractedText(mockText)
      
      const drugName = extractDrugName(mockText)
      
      setLoading(true)
      const result = await searchDrug(drugName)
      
      if (result && result.results && result.results.length > 0) {
        setDrugInfo(result.results[0])
      } else {
        setDrugInfo({
          brand_name: [drugName],
          generic_name: ['Acetaminophen'],
          manufacturer_name: ['Cipla Ltd'],
          product_type: ['Tablet'],
          dosage_form: ['Oral Tablet'],
          route: ['Oral'],
          active_ingredients: [{ name: 'Paracetamol', strength: '500mg' }],
          purpose: ['Pain relief', 'Fever reduction'],
          indications_and_usage: ['Temporary relief of minor aches and pains due to headache, muscle ache, backache, arthritis, and fever.'],
          warnings: ['Do not exceed recommended dose. Do not use with other products containing acetaminophen.'],
          adverse_reactions: ['Nausea', 'Stomach pain', 'Loss of appetite', 'Headache'],
          drug_interactions: ['May interact with blood thinners', 'May interact with certain seizure medications']
        })
      }

      const scanResult: ScanResult = {
        id: Date.now().toString(),
        imageUrl: imagePreview || '',
        extractedText: mockText,
        drugName,
        drugInfo: drugInfo || null,
        scannedAt: new Date()
      }
      setLastScan(scanResult)

      const user = auth.currentUser
      if (user) {
        await addDoc(collection(db, 'medications'), {
          userId: user.uid,
          ...scanResult,
          scannedAt: new Date()
        })
      }
    } catch (err) {
      console.error('Error:', err)
      setError('Failed to process image. Please try again.')
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
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">MedScan</h1>
        <p className="page-subtitle">Scan medication strips to get detailed drug information</p>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <div>
          {!imagePreview ? (
            <div 
              className="upload-zone"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="upload-icon" />
              <p style={{ fontWeight: 500, marginBottom: '0.25rem' }}>Upload tablet strip photo</p>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)' }}>
                Click to select or drag and drop
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
            <div className="card">
              <div style={{ position: 'relative' }}>
                <img 
                  src={imagePreview} 
                  alt="Scanned medication" 
                  style={{ 
                    width: '100%', 
                    borderRadius: '0.5rem',
                    maxHeight: '300px',
                    objectFit: 'cover'
                  }} 
                />
                {scanning && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(255,255,255,0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '0.5rem'
                  }}>
                    <Loader2 size={32} className="animate-spin" style={{ color: 'var(--primary)' }} />
                  </div>
                )}
              </div>
              <button 
                className="btn btn-secondary" 
                onClick={resetScanner}
                style={{ marginTop: '1rem', width: '100%' }}
              >
                Scan Another
              </button>
            </div>
          )}

          {error && (
            <div style={{ 
              marginTop: '1rem',
              padding: '1rem', 
              background: '#fee2e2', 
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

        <div>
          {extractedText && (
            <div className="card" style={{ marginBottom: '1rem' }}>
              <h3 style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ScanLine size={18} /> Extracted Text
              </h3>
              <pre style={{ 
                fontSize: '0.8rem', 
                whiteSpace: 'pre-wrap', 
                color: 'var(--gray-600)',
                background: 'var(--gray-50)',
                padding: '1rem',
                borderRadius: '0.5rem'
              }}>
                {extractedText}
              </pre>
            </div>
          )}

          {loading ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
              <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 1rem', color: 'var(--primary)' }} />
              <p>Looking up drug information...</p>
            </div>
          ) : drugInfo ? (
            <div className="card">
              <div style={{ marginBottom: '1.5rem' }}>
                <h2 className="drug-name">{drugInfo.brand_name?.[0] || 'Unknown Drug'}</h2>
                <p className="drug-brand">{drugInfo.generic_name?.[0]}</p>
                {drugInfo.manufacturer_name?.[0] && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginTop: '0.25rem' }}>
                    Manufacturer: {drugInfo.manufacturer_name[0]}
                  </p>
                )}
              </div>

              {drugInfo.active_ingredients && drugInfo.active_ingredients.length > 0 && (
                <>
                  <h4 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Pill size={16} /> Active Ingredients
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                    {drugInfo.active_ingredients.map((ing, i) => (
                      <span key={i} className="badge badge-success">
                        {ing.name} {ing.strength}
                      </span>
                    ))}
                  </div>
                </>
              )}

              {drugInfo.dosage_form && (
                <>
                  <h4 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Activity size={16} /> Dosage Form
                  </h4>
                  <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                    {drugInfo.dosage_form[0]} • {drugInfo.route?.[0]}
                  </p>
                </>
              )}

              {drugInfo.indications_and_usage && drugInfo.indications_and_usage.length > 0 && (
                <>
                  <h4 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FileText size={16} /> Uses
                  </h4>
                  <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                    {drugInfo.indications_and_usage[0]}
                  </p>
                </>
              )}

              {drugInfo.warnings && drugInfo.warnings.length > 0 && (
                <>
                  <h4 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)' }}>
                    <ShieldAlert size={16} /> Warnings
                  </h4>
                  <ul style={{ fontSize: '0.875rem', color: 'var(--gray-600)', paddingLeft: '1.25rem' }}>
                    {drugInfo.warnings.map((w, i) => (
                      <li key={i} style={{ marginBottom: '0.25rem' }}>{w}</li>
                    ))}
                  </ul>
                </>
              )}

              {drugInfo.adverse_reactions && drugInfo.adverse_reactions.length > 0 && (
                <>
                  <h4 className="section-title">Possible Side Effects</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {drugInfo.adverse_reactions.slice(0, 6).map((r, i) => (
                      <span key={i} className="badge badge-warning">{r}</span>
                    ))}
                  </div>
                </>
              )}

              {drugInfo.drug_interactions && drugInfo.drug_interactions.length > 0 && (
                <>
                  <h4 className="section-title">Drug Interactions</h4>
                  <ul style={{ fontSize: '0.875rem', color: 'var(--gray-600)', paddingLeft: '1.25rem' }}>
                    {drugInfo.drug_interactions.slice(0, 3).map((d, i) => (
                      <li key={i} style={{ marginBottom: '0.25rem' }}>{d}</li>
                    ))}
                  </ul>
                </>
              )}

              <div style={{ 
                marginTop: '1.5rem', 
                padding: '1rem', 
                background: 'var(--primary-light)', 
                borderRadius: '0.5rem',
                fontSize: '0.8rem',
                color: 'var(--primary-dark)'
              }}>
                <strong>Disclaimer:</strong> This information is for educational purposes only. 
                Always consult a healthcare professional before taking any medication.
              </div>
            </div>
          ) : (
            !imagePreview && (
              <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray-500)' }}>
                <ScanLine size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                <p>Upload a photo of your medication strip to get detailed information</p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}
