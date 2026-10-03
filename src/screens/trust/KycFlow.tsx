import { useEffect, useState } from 'react'
import { useAccount } from '@/app/AccountContext'
import { ownerKey } from '@/app/activityStore'
import {
  KYC_DOCUMENT_LABEL,
  KYC_NEEDS_BACK,
  latestKyc,
  submitKyc,
  useKycVersion,
  type KycDocumentType,
} from '@/app/kycStore'
import { extractDocumentFields, recognizeDocument, type ExtractedFields, type OcrProgress } from '@/app/ocr'
import { getLivenessProvider } from '@/app/kycLiveness'
import { CameraCapture } from '@/shared/ui/CameraCapture'
import { Button } from '@/shared/ui/Button'
import { Field, SelectInput, TextInput } from '@/shared/ui/Field'

type Step = 'intro' | 'document' | 'selfie' | 'review'
type Slot = 'front' | 'back' | 'selfie'

function useObjectUrl(file: File | null): string | null {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!file) return setUrl(null)
    const u = URL.createObjectURL(file)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [file])
  return url
}

function Thumb({ file, label }: { file: File | null; label: string }) {
  const url = useObjectUrl(file)
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex h-24 w-36 items-center justify-center overflow-hidden rounded-lg border border-border bg-surface-sunken text-[11px] text-text-2">
        {url ? <img src={url} alt={label} className="h-full w-full object-cover" /> : 'Not added'}
      </div>
      <span className="text-[11px] text-text-1">{label}</span>
    </div>
  )
}

/**
 * Identity check capture — works on a phone (rear camera for the ID, front
 * camera for the selfie) and on a desktop webcam, with file/camera-app
 * fallbacks. On-device OCR pre-fills the details; the person confirms them.
 * A human reviewer decides; liveness is not performed and says so.
 */
export function KycFlow() {
  const { account } = useAccount()
  const owner = ownerKey(account)
  useKycVersion()
  const latest = latestKyc(owner)
  const [started, setStarted] = useState(false)
  const [step, setStep] = useState<Step>('intro')
  const [consent, setConsent] = useState(false)
  const [docType, setDocType] = useState<KycDocumentType>('national_id')
  const [files, setFiles] = useState<Record<Slot, File | null>>({ front: null, back: null, selfie: null })
  const [camera, setCamera] = useState<Slot | null>(null)
  const [fields, setFields] = useState<Partial<ExtractedFields>>({})
  const [ocr, setOcr] = useState<{ running: boolean; progress: number; note: string | null }>({ running: false, progress: 0, note: null })
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const needsBack = KYC_NEEDS_BACK.includes(docType)
  const liveness = getLivenessProvider()

  // --- Existing submission states -----------------------------------------
  if (!started && latest) {
    if (latest.status === 'approved') {
      return (
        <div className="rounded-xl border border-success bg-success-soft p-4 text-sm text-text-0">
          <div className="mb-0.5 font-semibold">Identity verified</div>
          <p className="text-xs text-text-1">
            A PROFILE reviewer checked your {KYC_DOCUMENT_LABEL[latest.documentType].toLowerCase()} on {new Date(latest.reviewedAt ?? latest.createdAt).toLocaleDateString()}. This is what earns the Identity points on your Trust Score.
          </p>
        </div>
      )
    }
    if (latest.status === 'submitted' || latest.status === 'in_review') {
      return (
        <div className="rounded-xl border border-border bg-surface p-4 text-sm">
          <div className="mb-0.5 font-semibold text-text-0">Identity check {latest.status === 'in_review' ? 'in review' : 'submitted'}</div>
          <p className="text-xs text-text-1">
            Submitted {new Date(latest.createdAt).toLocaleString()}. A PROFILE reviewer will look at your documents — you'll get a notification when there's a decision. Liveness / face-match isn't automated yet, so the reviewer compares your selfie to your ID by eye.
          </p>
        </div>
      )
    }
    return (
      <div className="rounded-xl border border-danger bg-surface p-4 text-sm">
        <div className="mb-0.5 font-semibold text-text-0">Your last identity check wasn't approved</div>
        {latest.reviewerNote && <p className="mb-2 text-xs text-text-1">Reviewer's note: {latest.reviewerNote}</p>}
        <Button onClick={() => setStarted(true)}>Start again</Button>
      </div>
    )
  }

  if (!started) {
    return (
      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="mb-1 font-semibold text-text-0">Verify your identity</div>
        <p className="mb-3 text-xs text-text-1">Photograph a government ID and take a selfie, right from your phone or computer. A PROFILE reviewer checks them and, if approved, you earn your Identity trust points.</p>
        <Button onClick={() => setStarted(true)}>Start identity check</Button>
      </div>
    )
  }

  function setFile(slot: Slot, file: File) {
    setFiles((f) => ({ ...f, [slot]: file }))
    if (slot === 'front') void runOcr(file)
  }

  async function runOcr(file: File) {
    setOcr({ running: true, progress: 0, note: null })
    try {
      const { text } = await recognizeDocument(file, (p: OcrProgress) => setOcr((o) => ({ ...o, progress: p.progress })))
      const extracted = extractDocumentFields(text)
      setFields(extracted)
      setOcr({
        running: false,
        progress: 1,
        note: extracted.confidence === 'low' ? "We couldn't read much from this photo — please fill in the details below, or retake it in better light." : 'We read these details from your photo (on your device). Please check and correct them.',
      })
    } catch {
      setOcr({ running: false, progress: 0, note: "Automatic reading isn't available right now — please type the details below." })
    }
  }

  async function submit() {
    if (!files.front || !files.selfie) return
    setError(null)
    try {
      await submitKyc(owner, { documentType: docType, front: files.front, back: needsBack ? files.back : null, selfie: files.selfie, extracted: fields }, setBusy)
      setStarted(false)
    } catch (e) {
      setError((e as Error).message)
    }
    setBusy(null)
  }

  const frontOk = !!files.front && (!needsBack || !!files.back)

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="font-semibold text-text-0">Identity check</div>
        <button onClick={() => setStarted(false)} className="text-xs font-semibold text-text-1">Cancel</button>
      </div>
      <ol className="mb-4 flex gap-2 text-[11px] text-text-2" aria-label="Progress">
        {(['intro', 'document', 'selfie', 'review'] as Step[]).map((s, i) => (
          <li key={s} className={`rounded-full border px-2.5 py-0.5 ${step === s ? 'border-accent text-accent' : 'border-border'}`}>{i + 1}. {s === 'intro' ? 'Consent' : s === 'document' ? 'ID' : s === 'selfie' ? 'Selfie' : 'Review'}</li>
        ))}
      </ol>

      {step === 'intro' && (
        <div>
          <ul className="mb-3 list-disc ps-5 text-xs text-text-1">
            <li>You'll photograph your ID, then take a selfie. Use good light and keep all four corners of the ID in frame.</li>
            <li>Details are read from the photo on your own device; you confirm them before anything is sent.</li>
            <li>Your images are stored privately and shown only to authorised PROFILE reviewers.</li>
            <li>{liveness.available ? 'A liveness check runs as part of this.' : "Automated liveness / face-match isn't active yet — a reviewer compares your selfie to your ID manually."}</li>
          </ul>
          <label className="mb-3 flex items-start gap-2 text-xs text-text-0">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" />
            <span>I agree that PROFILE reviewers may view my ID and selfie to verify my identity.</span>
          </label>
          <Button disabled={!consent} onClick={() => setStep('document')}>Continue</Button>
        </div>
      )}

      {step === 'document' && (
        <div className="flex flex-col gap-3">
          <Field label="Document type">
            <SelectInput value={docType} onChange={(e) => setDocType(e.target.value as KycDocumentType)}>
              {(Object.keys(KYC_DOCUMENT_LABEL) as KycDocumentType[]).map((t) => (
                <option key={t} value={t}>{KYC_DOCUMENT_LABEL[t]}</option>
              ))}
            </SelectInput>
          </Field>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex flex-col items-start gap-2">
              <Thumb file={files.front} label="ID — front" />
              <Button variant="secondary" onClick={() => setCamera('front')}>{files.front ? 'Retake front' : 'Photograph front'}</Button>
            </div>
            {needsBack && (
              <div className="flex flex-col items-start gap-2">
                <Thumb file={files.back} label="ID — back" />
                <Button variant="secondary" onClick={() => setCamera('back')}>{files.back ? 'Retake back' : 'Photograph back'}</Button>
              </div>
            )}
          </div>
          {ocr.running && (
            <p role="status" className="text-xs text-text-1">Reading your document on this device… {Math.round(ocr.progress * 100)}%</p>
          )}
          {ocr.note && <p className="text-xs text-text-1">{ocr.note}</p>}
          {files.front && !ocr.running && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Full name"><TextInput value={fields.fullName ?? ''} onChange={(e) => setFields({ ...fields, fullName: e.target.value })} /></Field>
              <Field label="ID number"><TextInput value={fields.idNumber ?? ''} onChange={(e) => setFields({ ...fields, idNumber: e.target.value })} /></Field>
              <Field label="Date of birth"><TextInput type="date" value={fields.dateOfBirth ?? ''} onChange={(e) => setFields({ ...fields, dateOfBirth: e.target.value })} /></Field>
              <Field label="Expiry date"><TextInput type="date" value={fields.expiryDate ?? ''} onChange={(e) => setFields({ ...fields, expiryDate: e.target.value })} /></Field>
            </div>
          )}
          <div><Button disabled={!frontOk || ocr.running} onClick={() => setStep('selfie')}>Continue</Button></div>
        </div>
      )}

      {step === 'selfie' && (
        <div className="flex flex-col items-start gap-3">
          <p className="text-xs text-text-1">Take a clear, front-facing selfie in good light — no hat or sunglasses.</p>
          <Thumb file={files.selfie} label="Selfie" />
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setCamera('selfie')}>{files.selfie ? 'Retake selfie' : 'Take selfie'}</Button>
            <Button disabled={!files.selfie} onClick={() => setStep('review')}>Continue</Button>
          </div>
        </div>
      )}

      {step === 'review' && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-4">
            <Thumb file={files.front} label="ID — front" />
            {needsBack && <Thumb file={files.back} label="ID — back" />}
            <Thumb file={files.selfie} label="Selfie" />
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            <dt className="text-text-2">Document</dt><dd className="text-text-0">{KYC_DOCUMENT_LABEL[docType]}</dd>
            <dt className="text-text-2">Name</dt><dd className="text-text-0">{fields.fullName || '—'}</dd>
            <dt className="text-text-2">ID number</dt><dd className="text-text-0">{fields.idNumber || '—'}</dd>
            <dt className="text-text-2">Date of birth</dt><dd className="text-text-0">{fields.dateOfBirth || '—'}</dd>
            <dt className="text-text-2">Expiry</dt><dd className="text-text-0">{fields.expiryDate || '—'}</dd>
          </dl>
          {error && <p role="alert" className="text-xs text-danger">{error}</p>}
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={() => setStep('document')}>Back</Button>
            <Button disabled={!!busy} onClick={() => void submit()}>{busy ?? 'Submit for review'}</Button>
          </div>
        </div>
      )}

      <CameraCapture
        open={camera !== null}
        onClose={() => setCamera(null)}
        onCapture={(f) => camera && setFile(camera, f)}
        facing={camera === 'selfie' ? 'user' : 'environment'}
        guide={camera === 'selfie' ? 'face' : 'document'}
        title={camera === 'selfie' ? 'Take a selfie' : camera === 'back' ? 'Photograph the back of your ID' : 'Photograph the front of your ID'}
        hint={camera === 'selfie' ? 'Centre your face in the oval' : 'Fit the whole ID inside the dotted frame'}
      />
    </div>
  )
}
