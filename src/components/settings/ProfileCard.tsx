import { useRef, useState } from 'react'
import { Camera, Lock, Mail, Phone } from 'lucide-react'
import { toast } from 'sonner'
import CameraCapture from '@/components/CameraCapture'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { initials } from '@/lib/format'
import { errorText } from '@/lib/formErrors'
import { Field, IconInput } from './fields'
import PasswordDialog from './PasswordDialog'

/**
 * Carte « Profil » des paramètres : photo (caméra avant/arrière ou fichier), nom, téléphone, e-mail et mot de passe.
 * Les valeurs saisies sont gérées par la page (enregistrées d'un seul coup) ; la photo et le mot de passe partent tout de suite.
 */
export default function ProfileCard(props: {
  title: string
  description: string
  avatarUrl: string | null
  savedName: string
  fullName: string
  email: string
  phone: string
  emailHint: string
  /** Texte sous le mot de passe, par exemple « Modifié le … ». */
  passwordHint?: string
  idPrefix: string
  onChange: (patch: { fullName?: string; email?: string; phone?: string }) => void
  uploadAvatar: (file: File) => Promise<{ avatarUrl: string }>
  onAvatar: (url: string) => void
  changePassword: (body: { currentPassword: string; newPassword: string }) => Promise<unknown>
  onPasswordChanged?: () => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)

  const pickAvatar = async (file: File | undefined) => {
    if (!file) return
    setUploading(true)
    try {
      const { avatarUrl } = await props.uploadAvatar(file)
      props.onAvatar(avatarUrl)
      toast.success('Photo de profil mise à jour')
    } catch (err) {
      toast.error(errorText(err, "Impossible d'envoyer l'image"))
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const id = (name: string) => `${props.idPrefix}-${name}`

  return (
    <Card>
      <CardHeader>
        <CardTitle>{props.title}</CardTitle>
        <CardDescription>{props.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="flex shrink-0 flex-col items-center gap-3">
            <Avatar className="size-20 ring-4 ring-primary/15">
              {props.avatarUrl ? <AvatarImage src={props.avatarUrl} alt={props.fullName} /> : null}
              <AvatarFallback>{initials(props.fullName || props.savedName)}</AvatarFallback>
            </Avatar>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              aria-label="Choisir une photo de profil"
              onChange={(e) => void pickAvatar(e.target.files?.[0])}
            />
            <Button type="button" variant="link" size="sm" className="h-auto p-0 text-xs" disabled={uploading} onClick={() => setCameraOpen(true)}>
              <Camera />
              {uploading ? 'Envoi…' : 'Prendre une photo'}
            </Button>
            <Button type="button" variant="ghost" size="sm" className="h-auto p-0 text-xs text-muted-foreground" disabled={uploading} onClick={() => fileRef.current?.click()}>
              ou importer une image
            </Button>
            <CameraCapture
              open={cameraOpen}
              onClose={() => setCameraOpen(false)}
              title="Photo de profil"
              description="Choisissez la caméra avant ou arrière, cadrez votre visage puis déclenchez la prise de vue."
              initialFacing="user"
              filePrefix="profil"
              onCapture={(file) => {
                setCameraOpen(false)
                void pickAvatar(file)
              }}
            />
          </div>

          <div className="min-w-0 flex-1 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Nom complet" htmlFor={id('nom')}>
                <Input id={id('nom')} value={props.fullName} onChange={(e) => props.onChange({ fullName: e.target.value })} placeholder="Votre nom complet" />
              </Field>
              <Field label="Numéro de téléphone" htmlFor={id('phone')} hint="Sert aussi d'identifiant de connexion.">
                <IconInput id={id('phone')} icon={<Phone />} value={props.phone} onChange={(e) => props.onChange({ phone: e.target.value })} placeholder="6XX XXX XXX" />
              </Field>
            </div>
            <Field label="Adresse e-mail" htmlFor={id('email')} hint={props.emailHint}>
              <IconInput id={id('email')} icon={<Mail />} type="email" value={props.email} onChange={(e) => props.onChange({ email: e.target.value })} placeholder="email@exemple.cm" />
            </Field>

            <Field label="Mot de passe" htmlFor={id('password')} hint={props.passwordHint}>
              <div className="flex items-center gap-3">
                {/* Simple affichage, volontairement pas un champ : aucune valeur de mot de passe dans la page, rien à mémoriser pour le navigateur */}
                <div
                  id={id('password')}
                  className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-md border border-input bg-transparent px-3 text-sm text-muted-foreground select-none dark:bg-input/30"
                  role="img"
                  aria-label="Mot de passe masqué"
                >
                  <Lock className="size-4 shrink-0" />
                  <span aria-hidden>••••••••••••</span>
                </div>
                <Button type="button" variant="outline" onClick={() => setPasswordOpen(true)}>
                  Modifier
                </Button>
              </div>
            </Field>
          </div>
        </div>
      </CardContent>
      <PasswordDialog open={passwordOpen} onClose={() => setPasswordOpen(false)} onSubmit={props.changePassword} onChanged={props.onPasswordChanged} />
    </Card>
  )
}
