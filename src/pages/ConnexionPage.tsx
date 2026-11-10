import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AlertTriangle, ArrowRight, Download, Eye, EyeOff, Loader2, Lock, Mail, Phone } from 'lucide-react'
import AuthShell from '@/components/auth/AuthShell'
import { Alert, AlertDescription } from '@/components/ui/alert'
import InstallAppButton from '@/components/pwa/InstallAppButton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '../auth/useAuth'
import { resolvePostLoginPath } from '../auth/routeAccess'
import { login as loginRequest } from '../services/authService'
import { ApiError } from '../types/auth'

export default function ConnexionPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const [telephone, setTelephone] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const canSubmit = useMemo(() => telephone.trim().length > 0 && motDePasse.trim().length >= 6, [telephone, motDePasse])

  const fromPath =
    typeof location.state === 'object' &&
    location.state !== null &&
    'from' in location.state &&
    typeof (location.state as { from?: string }).from === 'string'
      ? (location.state as { from: string }).from
      : null

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit || isSubmitting) return

    setError(null)
    setIsSubmitting(true)
    try {
      const data = await loginRequest({ phoneNumber: telephone.trim(), password: motDePasse })
      login(data.access_token, data.user)
      navigate(resolvePostLoginPath(fromPath, data.user.role), { replace: true })
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 401) {
        setError('Identifiants invalides.')
      } else if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Impossible de se connecter. Vérifiez que le serveur est démarré.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthShell
      title="Connexion"
      subtitle="Entrez vos informations pour accéder à votre espace."
      panelTitle="Bon retour !"
      panelText="Gérez votre flotte, vos paiements et vos investissements au même endroit."
    >
      <form className="grid gap-6" onSubmit={onSubmit}>
        {error ? (
          <Alert variant="destructive">
            <AlertTriangle />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-2">
          <Label htmlFor="login-phone" className="text-base">Numéro de téléphone</Label>
          <div className="relative">
            <Phone className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
            <Input id="login-phone" className="h-12 pl-12 text-base md:text-base" value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="6XX XXX XXX" autoComplete="tel" />
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="login-password" className="text-base">Mot de passe</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
            <Input id="login-password" className="h-12 pl-12 pr-12 text-base md:text-base" type={showPassword ? 'text' : 'password'} value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 size-10 -translate-y-1/2 text-muted-foreground [&_svg]:size-5"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            >
              {showPassword ? <EyeOff /> : <Eye />}
            </Button>
          </div>
        </div>

        <Button type="submit" size="lg" className="h-13 text-base font-bold [&_svg]:size-5" disabled={!canSubmit || isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin" />
              Connexion…
            </>
          ) : (
            <>
              Se connecter
              <ArrowRight />
            </>
          )}
        </Button>

        <InstallAppButton>
          {({ onClick }) => (
            <Button type="button" variant="outline" size="lg" className="h-12 text-base [&_svg]:size-5" onClick={onClick} data-testid="install-app">
              <Download />
              Installer l&apos;application
            </Button>
          )}
        </InstallAppButton>

        <div className="mt-2 flex items-start gap-3 rounded-lg border bg-card p-4">
          <Mail className="mt-0.5 size-5 shrink-0 text-primary" />
          <p className="text-sm leading-relaxed text-muted-foreground">
            L&apos;accès se fait sur invitation. Contactez un administrateur pour obtenir votre lien d&apos;inscription.
          </p>
        </div>
      </form>
    </AuthShell>
  )
}
