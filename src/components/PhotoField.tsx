import { useEffect, useId, useState } from 'react'
import { Camera, ImagePlus, X } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import CameraCapture from './CameraCapture'

const MAX_BYTES = 5 * 1024 * 1024
const TYPES = ['image/jpeg', 'image/png', 'image/webp']

/** Erreur de l'image choisie, ou null si elle convient (JPEG, PNG ou WebP, 5 Mo au plus). */
function imageFileError(file: File): string | null {
  if (!TYPES.includes(file.type)) return 'Seules les images JPEG, PNG ou WebP sont acceptées.'
  if (file.size > MAX_BYTES) return 'Cette image dépasse 5 Mo.'
  return null
}

/** Champ « image » : prendre une photo avec la caméra ou importer un fichier, avec aperçu et retrait. Le fichier est tenu par le parent. */
export default function PhotoField(props: {
  label: string
  /** Mention affichée à côté du libellé, ex. « (optionnel) ». */
  hint?: string
  file: File | null
  onChange: (file: File | null) => void
  cameraTitle: string
  cameraDescription: string
  filePrefix: string
  /** Préfixe des data-testid (…-camera, …-import, …-input, …-preview). */
  testId: string
}) {
  const { file, onChange } = props
  const inputId = useId()
  const [cameraOpen, setCameraOpen] = useState(false)
  // aperçu lu en différé ; il n'est montré que s'il correspond au fichier actuel
  const [loaded, setLoaded] = useState<{ file: File; url: string } | null>(null)

  useEffect(() => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setLoaded({ file, url: String(reader.result) })
    reader.readAsDataURL(file)
    return () => reader.abort()
  }, [file])
  const preview = file && loaded?.file === file ? loaded.url : null

  const pick = (picked: File | undefined) => {
    if (!picked) return
    const problem = imageFileError(picked)
    if (problem) return void toast.error(problem)
    onChange(picked)
  }

  return (
    <div className="grid min-w-0 grid-cols-1 gap-2">
      <Label htmlFor={inputId}>
        {props.label} {props.hint ? <span className="font-normal text-muted-foreground">{props.hint}</span> : null}
      </Label>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" type="button" size="sm" onClick={() => setCameraOpen(true)} data-testid={`${props.testId}-camera`}>
          <Camera className="h-4 w-4" />
          Prendre une photo
        </Button>
        <Button variant="outline" type="button" size="sm" onClick={() => document.getElementById(inputId)?.click()} data-testid={`${props.testId}-import`}>
          <ImagePlus className="h-4 w-4" />
          Importer une image
        </Button>
        <input
          id={inputId}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          tabIndex={-1}
          data-testid={`${props.testId}-input`}
          onChange={(e) => {
            pick(e.target.files?.[0])
            e.target.value = ''
          }}
        />
      </div>
      {file ? (
        <div className="flex items-center gap-3 rounded-md border p-2" data-testid={`${props.testId}-preview`}>
          {preview ? <img src={preview} alt="Aperçu de l'image jointe" className="size-14 shrink-0 rounded object-cover" /> : <div className="size-14 shrink-0 rounded bg-muted" />}
          <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">{file.name}</span>
          <Button type="button" variant="ghost" size="icon" className="size-8" aria-label="Retirer l'image" onClick={() => onChange(null)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">JPEG, PNG ou WebP, 5 Mo au plus.</p>
      )}
      <CameraCapture
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        title={props.cameraTitle}
        description={props.cameraDescription}
        initialFacing="environment"
        filePrefix={props.filePrefix}
        onCapture={(captured) => {
          setCameraOpen(false)
          pick(captured)
        }}
      />
    </div>
  )
}
