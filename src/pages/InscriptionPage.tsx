import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, Loader2, Lock, Mail, Phone, User } from 'lucide-react'
import AuthShell from '@/components/auth/AuthShell'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { acceptInvitation, getInvitation } from '../services/authService'
import { ApiError, type InvitationInfo } from '../types/auth'
import { roleLabel } from '../auth/roles'

/** Inscription réservée aux personnes invitées par un administrateur (lien reçu par email). */
export default function InscriptionPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [invitation, setInvitation] = useState<InvitationInfo | null>(null)
  const [loading, setLoading] = useState(Boolean(token))
  const [loadError, setLoadError] = useState<string | null>(
    token ? null : "L'inscription est uniquement possible sur invitation d'un administrateur.",
  )

  const [nom, setNom] = useState('')
  const [telephone, setTelephone] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!token) return
    let cancelled = false
    getInvitation(token)
      .then((info) => {
        if (!cancelled) setInvitation(info)
      })
      .catch((err) => {
        if (cancelled) return
        setLoadError(
          err instanceof ApiError && err.statusCode === 410
            ? 'Cette invitation a expiré. Demandez-en une nouvelle à un administrateur.'
            : err instanceof ApiError && err.statusCode === 404
              ? 'Invitation introuvable ou déjà utilisée.'
              : "Impossible de vérifier l'invitation. Vérifiez que le serveur est démarré.",
        )
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [token])

  const canSubmit = useMemo(
    () => nom.trim().length > 0 && telephone.trim().length > 0 && motDePasse.trim().length >= 6,
    [nom, telephone, motDePasse],
  )

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !canSubmit || isSubmitting) return

    setError(null)
    setSuccess(null)
    setIsSubmitting(true)
    try {
      await acceptInvitation({
        token,
        fullName: nom.trim(),
        phoneNumber: telephone.trim(),
        password: motDePasse,
      })
      setSuccess('Compte créé avec succès. Vous pouvez vous connecter.')
      setTimeout(() => navigate('/connexion'), 1200)
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 409) {
        setError('Ce numéro de téléphone ou cet email est déjà utilisé.')
      } else if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Impossible de créer le compte. Vérifiez que le serveur est démarré.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthShell
      title="Créer mon compte"
      subtitle="Finalisez votre inscription à CamerRideShare."
      panelTitle="Déjà un compte ?"
      panelText="Connectez-vous pour retrouver votre espace et suivre votre activité."
      panelAction={
        <Button type="button" variant="outline" className="border-white/40 bg-transparent px-8 text-white hover:bg-white/10 hover:text-white" onClick={() => navigate('/connexion')}>
          Connexion
        </Button>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Vérification de l&apos;invitation…
        </div>
      ) : loadError || !invitation ? (
        <div className="grid gap-4">
          <Alert variant="destructive">
            <AlertTriangle />
            <AlertDescription>{loadError}</AlertDescription>
          </Alert>
          <Button type="button" variant="outline" onClick={() => navigate('/connexion')}>
            Aller à la connexion
          </Button>
        </div>
      ) : (
        <form className="grid gap-4" onSubmit={onSubmit}>
          {error ? (
            <Alert variant="destructive">
              <AlertTriangle />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          {success ? (
            <Alert>
              <CheckCircle2 />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-2">
            <Label htmlFor="reg-email">Email</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="reg-email" className="pl-10" value={invitation.email} readOnly disabled />
            </div>
            <p className="text-xs text-muted-foreground">Compte {roleLabel(invitation.role).toLowerCase()}</p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="reg-name">Nom complet</Label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="reg-name" className="pl-10" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nom complet" />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="reg-phone">Numéro de téléphone</Label>
            <div className="relative">
              <Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="reg-phone" className="pl-10" value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="6XX XXX XXX" autoComplete="tel" />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="reg-password">Mot de passe</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="reg-password" className="pl-10" type="password" value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} placeholder="Min. 6 caractères" autoComplete="new-password" />
            </div>
          </div>

          <Button type="submit" size="lg" disabled={!canSubmit || isSubmitting || Boolean(success)}>
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" />
                Création…
              </>
            ) : (
              'Créer mon compte'
            )}
          </Button>
        </form>
      )}
    </AuthShell>
  )
}
