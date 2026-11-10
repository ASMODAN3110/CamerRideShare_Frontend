import { useEffect, useRef, useState } from 'react'
import { Camera, Loader2, SwitchCamera } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

type Facing = 'environment' | 'user'

function CameraView(props: { initialFacing: Facing; filePrefix: string; onCapture: (file: File) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [facing, setFacing] = useState<Facing>(props.initialFacing)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) {
      Promise.resolve().then(() =>
        setError("La caméra n'est pas disponible ici (elle requiert une connexion HTTPS ou localhost)."),
      )
      return
    }
    let cancelled = false
    let stream: MediaStream | null = null
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: facing }, width: { ideal: 1920 } }, audio: false })
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop())
          return
        }
        stream = s
        if (videoRef.current) videoRef.current.srcObject = s
        setReady(true)
        setError(null)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        const denied = err instanceof DOMException && err.name === 'NotAllowedError'
        setError(
          denied
            ? "Accès à la caméra refusé. Autorisez-le dans les réglages du navigateur."
            : "Impossible d'ouvrir la caméra sur cet appareil.",
        )
      })
    return () => {
      cancelled = true
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [facing])

  function switchCamera() {
    setReady(false)
    setFacing((f) => (f === 'environment' ? 'user' : 'environment'))
  }

  function capture() {
    const video = videoRef.current
    if (!video || !video.videoWidth) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')?.drawImage(video, 0, 0)
    canvas.toBlob(
      (blob) => {
        if (!blob) return
        props.onCapture(new File([blob], `${props.filePrefix}-${Date.now()}.jpg`, { type: 'image/jpeg' }))
      },
      'image/jpeg',
      0.9,
    )
  }

  return (
    <>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`size-full object-cover ${facing === 'user' ? '-scale-x-100' : ''}`}
          />
          {!ready ? (
            <div className="absolute inset-0 flex items-center justify-center text-white">
              <Loader2 className="size-6 animate-spin" />
            </div>
          ) : null}
        </div>
      )}
      <DialogFooter className="gap-2 sm:justify-between">
        <Button type="button" variant="outline" onClick={switchCamera} disabled={!!error}>
          <SwitchCamera />
          {facing === 'environment' ? 'Caméra avant' : 'Caméra arrière'}
        </Button>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" onClick={props.onClose}>
            Annuler
          </Button>
          <Button type="button" onClick={capture} disabled={!ready || !!error}>
            <Camera />
            Prendre la photo
          </Button>
        </div>
      </DialogFooter>
    </>
  )
}

/** Fenêtre de prise de photo avec la caméra de l'appareil (avant ou arrière, au choix). */
export default function CameraCapture(props: {
  open: boolean
  onClose: () => void
  onCapture: (file: File) => void
  title?: string
  description?: string
  /** Caméra utilisée à l'ouverture : « environment » (arrière, par défaut) ou « user » (avant, pour un portrait). */
  initialFacing?: Facing
  /** Préfixe du nom du fichier photographié. */
  filePrefix?: string
}) {
  return (
    <Dialog open={props.open} onOpenChange={(open) => (!open ? props.onClose() : undefined)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{props.title ?? 'Prendre une photo'}</DialogTitle>
          <DialogDescription>{props.description ?? 'Cadrez le véhicule puis déclenchez la prise de vue.'}</DialogDescription>
        </DialogHeader>
        {props.open ? (
          <CameraView
            initialFacing={props.initialFacing ?? 'environment'}
            filePrefix={props.filePrefix ?? 'moto'}
            onCapture={props.onCapture}
            onClose={props.onClose}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
