import { useState, useRef } from 'react'
import { addDoc, collection } from 'firebase/firestore'
import { db, auth } from '../../services/firebase'
import { analyzeMedicationImage, MedicineInsight } from '../../services/openRouter'
import { searchDrug } from '../../services/drugApi'
import { 
  ScanLine, Upload, AlertCircle, Pill, Activity, ShieldAlert, 
  CheckCircle, Info, ArrowRight, RefreshCw, AlertTriangle,
  Clock, DollarSign, FlaskConical, Baby, Package
} from 'lucide-react'

interface ScanResult {
  id: string
  imageUrl: string
  insight: MedicineInsight
  scannedAt: Date
}

const COMMON_INDIAN_MEDICINES: Record<string, { brand: string; generic: string[]; uses: string[]; strength: string }> = {
  'crocin': { brand: 'Crocin', generic: ['Paracetamol'], uses: ['Fever', 'Pain relief'], strength: '500mg' },
  'combiflam': { brand: 'Combiflam', generic: ['Paracetamol', 'Ibuprofen'], uses: ['Pain relief', 'Fever', 'Inflammation'], strength: '325mg+400mg' },
  'azithral': { brand: 'Azithral', generic: ['Azithromycin'], uses: ['Bacterial infections'], strength: '500mg' },
  'augmentin': { brand: 'Augmentin', generic: ['Amoxicillin', 'Clavulanic acid'], uses: ['Bacterial infections'], strength: '625mg' },
  'amox': { brand: 'Amox', generic: ['Amoxicillin'], uses: ['Bacterial infections'], strength: '500mg' },
  'calpol': { brand: 'Calpol', generic: ['Paracetamol'], uses: ['Fever', 'Pain relief'], strength: '500mg' },
  'dolo': { brand: 'Dolo 650', generic: ['Paracetamol'], uses: ['Fever', 'Pain relief'], strength: '650mg' },
  'metrogyl': { brand: 'Metrogyl', generic: ['Metronidazole'], uses: ['Bacterial infections', 'Protozoal infections'], strength: '400mg' },
  'zerodol': { brand: 'Zerodol', generic: ['Aceclofenac'], uses: ['Pain', 'Inflammation'], strength: '100mg' },
  'ultracet': { brand: 'Ultracet', generic: ['Tramadol', 'Paracetamol'], uses: ['Severe pain'], strength: '325mg+37.5mg' },
  'ciplox': { brand: 'Ciplox', generic: ['Ciprofloxacin'], uses: ['Bacterial infections'], strength: '500mg' },
  'nexpro': { brand: 'Nexpro', generic: ['Esomeprazole'], uses: ['Acid reflux', 'GERD'], strength: '40mg' },
  'pan': { brand: 'Pan 40', generic: ['Pantoprazole'], uses: ['Acid reflux', 'GERD'], strength: '40mg' },
  'histac': { brand: 'Histac', generic: ['Ranitidine'], uses: ['Acid reflux', 'Ulcer'], strength: '150mg' },
  'avil': { brand: 'Avil', generic: ['Pheniramine maleate'], uses: ['Allergies'], strength: '25mg' },
  'benadryl': { brand: 'Benadryl', generic: ['Diphenhydramine'], uses: ['Allergies', 'Cold'], strength: '25mg' },
  'chymoral': { brand: 'Chymoral', generic: ['Trypsin', 'Chymotrypsin'], uses: ['Inflammation', 'Swelling'], strength: '100000AU' },
  'movicol': { brand: 'Movicol', generic: ['Macrogol'], uses: ['Constipation'], strength: '13.8g' },
  'envirin': { brand: 'Envirin', generic: ['Ofloxacin', 'Ornidazole'], uses: ['Bacterial infections'], strength: '500mg+500mg' },
  'montec': { brand: 'Montec LC', generic: ['Montelukast', 'Levocetirizine'], uses: ['Allergies', 'Asthma'], strength: '10mg+5mg' },
}

function lookupByImprint(imprint: string): { brand: string; generic: string[]; uses: string[]; strength: string } | null {
  const lower = imprint.toLowerCase().replace(/[^a-z0-9]/g, '')
  for (const [key, value] of Object.entries(COMMON_INDIAN_MEDICINES)) {
    if (lower.includes(key) || key.includes(lower) && lower.length > 2) {
      return value
    }
  }
  return null
}

export default function MedScanner() {
  const [scanning, setScanning] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [insight, setInsight] = useState<MedicineInsight | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleAddToMeds = async () => {
    if (!insight || !imagePreview) return
    
    setSaving(true)
    try {
      const medData = {
        imageUrl: imagePreview,
        brandName: insight.medicine?.brand_name || 'Unknown',
        genericName: insight.medicine?.generic_name || [],
        strength: insight.medicine?.strength || '',
        dosageForm: insight.medicine?.dosage_form || '',
        manufacturer: insight.medicine?.manufacturer || '',
        uses: insight.medical_info?.uses || [],
        warnings: insight.medical_info?.warnings || [],
        sideEffects: insight.medical_info?.common_side_effects || [],
        riskLevel: insight.insights?.safety_risk_level || 'low',
        requiresPrescription: insight.risk_flags?.requires_prescription || false,
        scannedAt: new Date()
      }
      
      await addDoc(collection(db, 'medications'), medData)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e: any) {
      console.error('Save error:', e)
      alert('Failed to save: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

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
    setInsight(null)

    try {
      setLoading(true)
      
      let result = await analyzeMedicationImage(base64Image)
      
      if (result.medicine?.brand_name && result.medicine.brand_name !== 'Unknown' && result.identified) {
        try {
          const drugData = await searchDrug(result.medicine.brand_name)
          if (drugData?.results?.[0]) {
            const fd = drugData.results[0]
            result = {
              ...result,
              medicine: {
                ...result.medicine,
                manufacturer: result.medicine.manufacturer || fd.manufacturer_name?.[0] || '',
                generic_name: (result.medicine.generic_name && result.medicine.generic_name.length > 0) 
                  ? result.medicine.generic_name 
                  : (fd.generic_name || []),
              },
              medical_info: {
                ...result.medical_info,
                uses: (result.medical_info.uses && result.medical_info.uses.length > 0) 
                  ? result.medical_info.uses 
                  : fd.indications_and_usage || [],
                warnings: (result.medical_info.warnings && result.medical_info.warnings.length > 0) 
                  ? result.medical_info.warnings 
                  : fd.warnings || [],
                common_side_effects: (result.medical_info.common_side_effects && result.medical_info.common_side_effects.length > 0) 
                  ? result.medical_info.common_side_effects 
                  : fd.adverse_reactions || [],
              }
            }
          }
        } catch (e) {
          console.log('OpenFDA lookup skipped', e)
        }
      }
      
      if ((!result.medicine?.brand_name || result.medicine.brand_name === 'Unknown' || !result.identified) && result.tablet_details?.imprint) {
        const lookup = lookupByImprint(result.tablet_details.imprint)
        if (lookup) {
          result = {
            ...result,
            identified: true,
            confidence_score: Math.max(result.confidence_score, 0.7),
            medicine: {
              ...result.medicine,
              brand_name: lookup.brand,
              generic_name: lookup.generic,
              strength: lookup.strength || result.medicine.strength,
            },
            medical_info: {
              ...result.medical_info,
              uses: lookup.uses,
            }
          }
        }
      }
      
      setInsight(result)
      
      setTimeout(() => setShowDetails(true), 300)
    } catch (err: any) {
      console.error('Error:', err)
      setError(err.message || 'Failed to process image')
    } finally {
      setScanning(false)
      setLoading(false)
    }
  }

  const resetScanner = () => {
    setImagePreview(null)
    setInsight(null)
    setError('')
    setShowDetails(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return '#ef4444'
      case 'moderate': return '#f59e0b'
      default: return '#10b981'
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title" style={{ 
          background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          MedScan
        </h1>
        <p className="page-subtitle">AI-powered medication analysis</p>
      </div>

      <div className="grid-2" style={{ alignItems: 'start', gap: '2rem' }}>
        <div>
          {!imagePreview ? (
            <div 
              className="upload-zone"
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed #06b6d4',
                background: 'linear-gradient(135deg, #f0fdfa, #cffafe)',
                borderRadius: '1rem',
                padding: '3rem 2rem',
                cursor: 'pointer'
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
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ position: 'relative', borderRadius: '0.5rem', overflow: 'hidden' }}>
                <img 
                  src={imagePreview} 
                  alt="Scanned medication" 
                  style={{ width: '100%', maxHeight: '280px', objectFit: 'cover' }} 
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
                    color: 'white'
                  }}>
                    <div style={{ animation: 'float 2s ease-in-out infinite' }}>
                      <ScanLine size={64} style={{ marginBottom: '1rem' }} />
                    </div>
                    <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>Analyzing...</p>
                    <div style={{ marginTop: '1.5rem', width: '200px', height: '4px', background: 'rgba(255,255,255,0.3)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ width: '50%', height: '100%', background: 'white', borderRadius: '2px', animation: 'loading 1.5s ease-in-out infinite' }} />
                    </div>
                    <style>{`
                      @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
                      @keyframes loading { 0% { transform: translateX(-100%); } 100% { transform: translateX(250%); } }
                    `}</style>
                  </div>
                )}
              </div>
              <button 
                className="btn btn-secondary" 
                onClick={resetScanner}
                style={{ marginTop: '1rem', width: '100%', background: '#f0fdfa', color: '#06b6d4', border: '1px solid #06b6d4' }}
              >
                <RefreshCw size={16} /> Scan Another
              </button>
            </div>
          )}

          {error && (
            <div style={{ marginTop: '1rem', padding: '1rem', background: '#fef2f2', color: '#dc2626', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={20} />
              {error}
            </div>
          )}
        </div>

        <div style={{ transition: 'opacity 0.4s ease', opacity: showDetails ? 1 : 0.5 }}>
          {!imagePreview && (
            <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem', color: '#9ca3af', background: '#f0fdfa' }}>
              <ScanLine size={48} style={{ margin: '0 auto 1rem', opacity: 0.5, color: '#06b6d4' }} />
              <p>Upload a photo to get started</p>
            </div>
          )}

          {loading && !scanning && (
            <div className="card" style={{ textAlign: 'center', padding: '3rem', background: '#f0fdfa' }}>
              <div style={{ width: '60px', height: '60px', border: '3px solid #cffafe', borderTopColor: '#06b6d4', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
              <p style={{ color: '#134e4a', fontWeight: 500 }}>Processing...</p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {insight && showDetails && (
            <div className="card" style={{ animation: 'slideIn 0.4s ease-out', background: 'white', border: '1px solid #cffafe', maxHeight: '80vh', overflowY: 'auto' }}>
              <style>{`@keyframes slideIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }`}</style>
              
              {!insight.is_valid ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <AlertTriangle size={48} style={{ color: '#f59e0b', marginBottom: '1rem' }} />
                  <h3 style={{ color: '#92400e', marginBottom: '0.5rem' }}>Unable to Analyze</h3>
                  <p style={{ color: '#78350f', fontSize: '0.875rem' }}>{insight.insights?.summary || 'Please upload a clearer image of the medication.'}</p>
                </div>
              ) : (
                <>
                  {/* Header with Brand and Risk */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '2px solid #06b6d4' }}>
                    <div>
                      <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#134e4a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {insight.medicine?.brand_name || 'Unknown'}
                        {insight.identified && <CheckCircle size={20} style={{ color: '#10b981' }} />}
                      </h2>
                      {insight.medicine?.generic_name && (
                        <p style={{ color: '#0891b2', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                          {Array.isArray(insight.medicine.generic_name) ? insight.medicine.generic_name.join(', ') : insight.medicine.generic_name}
                        </p>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                      <span style={{
                        background: insight.insights?.safety_risk_level === 'high' ? '#fee2e2' : insight.insights?.safety_risk_level === 'moderate' ? '#fef3c7' : '#d1fae5',
                        color: insight.insights?.safety_risk_level === 'high' ? '#dc2626' : insight.insights?.safety_risk_level === 'moderate' ? '#d97706' : '#059669',
                        padding: '0.4rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        textTransform: 'uppercase'
                      }}>
                        {insight.insights?.safety_risk_level || 'low'} risk
                      </span>
                      <button
                        onClick={handleAddToMeds}
                        disabled={saving || saved}
                        style={{
                          padding: '0.4rem 0.75rem',
                          borderRadius: '0.5rem',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          border: 'none',
                          cursor: saving ? 'wait' : 'pointer',
                          background: saved ? '#10b981' : '#06b6d4',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}
                      >
                        {saved ? <CheckCircle size={14} /> : saving ? 'Saving...' : 'Add to Meds'}
                      </button>
                    </div>
                  </div>

                  {/* Quick Info Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
                    {insight.medicine?.strength && (
                      <QuickInfo label="Strength" value={insight.medicine.strength} />
                    )}
                    {insight.medicine?.dosage_form && (
                      <QuickInfo label="Form" value={insight.medicine.dosage_form} />
                    )}
                    {insight.medicine?.manufacturer && (
                      <QuickInfo label="Manufacturer" value={insight.medicine.manufacturer} />
                    )}
                  </div>

                  {/* Prescription Required */}
                  {insight.risk_flags?.requires_prescription && (
                    <div style={{ padding: '0.6rem', background: '#fef3c7', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#92400e', marginBottom: '1rem', fontWeight: 600 }}>
                      <AlertCircle size={18} />
                      Prescription Required
                    </div>
                  )}

                  {/* Identification Info */}
                  <InfoSection title="Identification" icon={<Info size={16} />} color="#0891b2">
                    <InfoRow label="Valid image" value={insight.is_valid ? 'Yes' : 'No'} />
                    <InfoRow label="Image type" value={insight.image_type || '-'} />
                    <InfoRow label="Confidence" value={`${(insight.confidence_score * 100).toFixed(0)}%`} />
                    <InfoRow label="Identified" value={insight.identified ? 'Yes' : 'No'} />
                  </InfoSection>

                  {/* Packaging & Tablet */}
                  <InfoSection title="Packaging & Tablet" icon={<Package size={16} />} color="#8b5cf6">
                    {insight.tablet_details?.color && <InfoRow label="Color" value={insight.tablet_details.color} />}
                    {insight.tablet_details?.shape && <InfoRow label="Shape" value={insight.tablet_details.shape} />}
                    {insight.tablet_details?.imprint && <InfoRow label="Imprint" value={insight.tablet_details.imprint} />}
                    {insight.tablet_details?.coating && <InfoRow label="Coating" value={insight.tablet_details.coating} />}
                    {insight.tablet_details?.scored !== undefined && <InfoRow label="Scored" value={insight.tablet_details.scored ? 'Yes' : 'No'} />}
                    {insight.packaging_details?.batch_number && <InfoRow label="Batch" value={insight.packaging_details.batch_number} />}
                    {insight.packaging_details?.manufacturing_date && <InfoRow label="MFG Date" value={insight.packaging_details.manufacturing_date} />}
                    {insight.packaging_details?.expiry_date && <InfoRow label="Expiry" value={insight.packaging_details.expiry_date} />}
                    {insight.packaging_details?.mrp && <InfoRow label="MRP" value={insight.packaging_details.mrp} />}
                    {insight.packaging_details?.strip_size && <InfoRow label="Strip Size" value={insight.packaging_details.strip_size} />}
                    {insight.packaging_details?.storage_instructions && <InfoRow label="Storage" value={insight.packaging_details.storage_instructions} />}
                  </InfoSection>

                  {/* Uses */}
                  {insight.medical_info?.uses && insight.medical_info.uses.length > 0 && (
                    <InfoSection title="Medical Information" icon={<Pill size={16} />} color="#10b981">
                      <div style={{ marginBottom: '0.75rem' }}>
                        <p style={{ fontSize: '0.75rem', color: '#065f46', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.5rem' }}>Uses</p>
                        <ul style={{ paddingLeft: '1rem', margin: 0 }}>
                          {insight.medical_info.uses.map((use, i) => (
                            <li key={i} style={{ fontSize: '0.85rem', color: '#047857', marginBottom: '0.25rem' }}>{use}</li>
                          ))}
                        </ul>
                      </div>
                      {insight.medical_info?.how_it_works && (
                        <div style={{ paddingTop: '0.5rem', borderTop: '1px solid #a7f3d0' }}>
                          <p style={{ fontSize: '0.75rem', color: '#065f46', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.25rem' }}>How it works</p>
                          <p style={{ fontSize: '0.85rem', color: '#047857', fontStyle: 'italic' }}>{insight.medical_info.how_it_works}</p>
                        </div>
                      )}
                    </InfoSection>
                  )}

                  {/* Side Effects */}
                  {insight.medical_info?.common_side_effects && insight.medical_info.common_side_effects.length > 0 && (
                    <InfoSection title="Common Side Effects" icon={<AlertTriangle size={16} />} color="#f59e0b">
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {insight.medical_info.common_side_effects.map((s, i) => (
                          <span key={i} style={{ padding: '0.3rem 0.6rem', background: '#fef3c7', color: '#92400e', borderRadius: '0.3rem', fontSize: '0.75rem' }}>
                            {s}
                          </span>
                        ))}
                      </div>
                    </InfoSection>
                  )}

                  {insight.medical_info?.serious_side_effects && insight.medical_info.serious_side_effects.length > 0 && (
                    <InfoSection title="Serious Side Effects" icon={<AlertTriangle size={16} />} color="#dc2626">
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {insight.medical_info.serious_side_effects.map((s, i) => (
                          <span key={i} style={{ padding: '0.3rem 0.6rem', background: '#fee2e2', color: '#991b1b', borderRadius: '0.3rem', fontSize: '0.75rem', fontWeight: 500 }}>
                            {s}
                          </span>
                        ))}
                      </div>
                    </InfoSection>
                  )}

                  {/* Warnings */}
                  {insight.medical_info?.warnings && insight.medical_info.warnings.length > 0 && (
                    <InfoSection title="Warnings" icon={<ShieldAlert size={16} />} color="#ef4444">
                      {insight.medical_info.warnings.map((w, i) => (
                        <p key={i} style={{ fontSize: '0.85rem', color: '#92400e', marginBottom: '0.35rem' }}>• {w}</p>
                      ))}
                    </InfoSection>
                  )}

                  {/* Risk & Insights */}
                  <InfoSection title="Risk & Insights" icon={<Info size={16} />} color="#6366f1">
                    {insight.insights?.summary && (
                      <div style={{ marginBottom: '0.75rem' }}>
                        <p style={{ fontSize: '0.85rem', color: '#374151', lineHeight: 1.5 }}>{insight.insights.summary}</p>
                      </div>
                    )}
                    {insight.insights?.overdose_risk && <InfoRow label="Overdose risk" value={insight.insights.overdose_risk} />}
                    {insight.insights?.addiction_potential !== undefined && <InfoRow label="Addiction potential" value={insight.insights.addiction_potential ? 'Yes' : 'No'} />}
                    {insight.insights?.when_to_see_doctor && (
                      <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: '#fef3c7', borderRadius: '0.3rem' }}>
                        <p style={{ fontSize: '0.75rem', color: '#92400e', fontWeight: 600, marginBottom: '0.25rem' }}>When to see doctor</p>
                        <p style={{ fontSize: '0.8rem', color: '#78350f' }}>{insight.insights.when_to_see_doctor}</p>
                      </div>
                    )}
                  </InfoSection>

                  {/* Flags */}
                  <InfoSection title="Flags" icon={<AlertCircle size={16} />} color="#ec4899">
                    <InfoRow label="Expired" value={insight.risk_flags?.is_expired ? 'Yes' : 'No'} />
                    <InfoRow label="Schedule H" value={insight.risk_flags?.is_schedule_h ? 'Yes' : 'No'} />
                    <InfoRow label="High alert" value={insight.risk_flags?.is_high_alert_medicine ? 'Yes' : 'No'} />
                    <InfoRow label="Needs prescription" value={insight.risk_flags?.requires_prescription ? 'Yes' : 'No'} />
                    <InfoRow label="Human review needed" value={insight.needs_human_review ? 'Yes' : 'No'} />
                  </InfoSection>

                  {/* Disclaimer */}
                  <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#f0fdfa', borderRadius: '0.5rem', fontSize: '0.7rem', color: '#5eead4', textAlign: 'center' }}>
                    {insight.disclaimer}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Section({ title, icon, color, children }: { title: string; icon: React.ReactNode; color: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: '1rem' }}>
      <h4 style={{ fontSize: '0.75rem', color: color, textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {icon} {title}
      </h4>
      {children}
    </div>
  )
}

function QuickInfo({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: '0.5rem', background: '#f0fdfa', borderRadius: '0.4rem', textAlign: 'center' }}>
      <p style={{ fontSize: '0.65rem', color: '#5eead4', textTransform: 'uppercase', fontWeight: 600 }}>{label}</p>
      <p style={{ fontSize: '0.8rem', color: '#134e4a', fontWeight: 700, marginTop: '0.15rem' }}>{value}</p>
    </div>
  )
}

function InfoSection({ title, icon, color, children }: { title: string; icon: React.ReactNode; color: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '0.5rem', border: `1px solid ${color}30` }}>
      <h4 style={{ fontSize: '0.7rem', color: color, textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
        {icon} {title}
      </h4>
      {children}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', borderBottom: '1px solid #e2e8f0' }}>
      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{label}</span>
      <span style={{ fontSize: '0.8rem', color: '#334155', fontWeight: 500 }}>{value}</span>
    </div>
  )
}
