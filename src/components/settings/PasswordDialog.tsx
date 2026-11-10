import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { errorText } from '@/lib/formErrors'
import { Field } from './fields'

/** Changement de mot de passe : le service appelé dépend de l'espace (admin, investisseur). */
export default function PasswordDialog(props: {
  open: boolean
  onClose: () => void
  onSubmit: (body: { currentPassword: string; newPassword: string }) => Promise<unknown>
  onChanged?: () => void
}) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const close = () => {
    setCurrent('')
    setNext('')
    setConfirm('')
    setError(null)
    props.onClose()
  }

  const submit = async () => {
    if (next.length < 6) return setError('Le nouveau mot de passe doit contenir au moins 6 caractères')
    if (next !== confirm) return setError('La confirmation ne correspond pas au nouveau mot de passe')
    setBusy(true)
    setError(null)
    try {
      await props.onSubmit({ currentPassword: current, newPassword: next })
      toast.success('Mot de passe modifié')
      props.onChanged?.()
      close()
    } catch (err) {
      setError(errorText(err, 'Modification impossible'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={props.open} onOpenChange={(open) => (!open ? close() : undefined)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Modifier le mot de passe</DialogTitle>
          <DialogDescription>Saisissez votre mot de passe actuel puis le nouveau.</DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            void submit()
          }}
        >
          {error ? (
            <Alert variant="destructive">
              <AlertTriangle />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <Field label="Mot de passe actuel" htmlFor="pwd-current">
            <Input id="pwd-current" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
          </Field>
          <Field label="Nouveau mot de passe" htmlFor="pwd-new" hint="6 caractères minimum.">
            <Input id="pwd-new" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} required />
          </Field>
          <Field label="Confirmer le nouveau mot de passe" htmlFor="pwd-confirm">
            <Input id="pwd-confirm" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={close}>
              Annuler
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? 'Enregistrement…' : 'Modifier'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
