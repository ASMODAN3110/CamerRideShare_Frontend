import { useRef, useState, type DragEvent } from 'react'
import { Camera, ImagePlus, Loader2, Trash2, UploadCloud } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { uploadMotoImage } from '../services/fleetService'
import CameraCapture from './CameraCapture'

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES = 5 * 1024 * 1024

/** Zone de dépôt / sélection d'une image ; téléverse le fichier et renvoie son URL via onChange. */
export default function ImageUpload(props: {
  id: string
  value: string
  onChange: (url: string) => void
  disabled?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cameraOpen, setCameraOpen] = useState(false)

  async function handleFile(file: File | undefined) {
    if (!file) return
    if (!ACCEPTED.includes(file.type)) {
      setError('Format non pris en charge (JPEG, PNG ou WebP).')
      return
    }
    if (file.size > MAX_BYTES) {
      setError('Image trop lourde (5 Mo maximum).')
      return
    }
    setError(null)
    setUploading(true)
    try {
      const { url } = await uploadMotoImage(file)
      props.onChange(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'envoi de l'image.")
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragging(false)
    if (!props.disabled && !uploading) void handleFile(e.dataTransfer.files?.[0])
  }

  const busy = uploading || props.disabled

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        id={props.id}
        type="file"
        accept={ACCEPTED.join(',')}
        className="sr-only"
        disabled={busy}
        onChange={(e) => void handleFile(e.target.files?.[0])}
      />

      {props.value ? (
        <div className="flex items-center gap-3 rounded-md border bg-muted/30 p-2">
          <img src={props.value} alt="Aperçu du véhicule" className="h-16 w-24 shrink-0 rounded object-cover" />
          <div className="flex min-w-0 flex-1 flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => inputRef.current?.click()}>
              {uploading ? <Loader2 className="animate-spin" /> : <ImagePlus />}
              Remplacer
            </Button>
            <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => setCameraOpen(true)}>
              <Camera />
              Photo
            </Button>
            <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={() => props.onChange('')}>
              <Trash2 />
              Retirer
            </Button>
          </div>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          aria-label="Choisir ou déposer une image"
          onClick={() => !busy && inputRef.current?.click()}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && !busy) {
              e.preventDefault()
              inputRef.current?.click()
            }
          }}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed px-4 py-6 text-center transition-colors hover:border-primary hover:bg-accent/50',
            dragging && 'border-primary bg-accent/50',
            busy && 'pointer-events-none opacity-60',
          )}
        >
          {uploading ? <Loader2 className="size-6 animate-spin text-primary" /> : <UploadCloud className="size-6 text-primary" />}
          <p className="text-sm font-semibold">{uploading ? 'Envoi en cours…' : 'Glissez une image ou cliquez pour importer'}</p>
          <p className="text-xs text-muted-foreground">JPEG, PNG ou WebP · 5 Mo max</p>
        </div>
      )}

      {props.value ? null : (
        <Button type="button" variant="outline" size="sm" className="w-full" disabled={busy} onClick={() => setCameraOpen(true)}>
          <Camera />
          Prendre une photo avec la caméra
        </Button>
      )}

      <CameraCapture
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={(file) => {
          setCameraOpen(false)
          void handleFile(file)
        }}
      />

      {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
    </div>
  )
}
