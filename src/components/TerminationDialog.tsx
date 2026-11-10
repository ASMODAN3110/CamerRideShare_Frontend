import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { REASON_LABEL } from '../lib/termination'
import type { TerminationReason } from '../types/api'

/**
 * Confirmation d'une résiliation : motif obligatoire, précision facultative. Le contenu est monté à l'ouverture
 * seulement, pour que chaque ouverture reparte d'un formulaire vide.
 */
export function TerminationDialog(props: {
  open: boolean
  title: string
  description: string
  /** Motifs proposés ; le premier est présélectionné. Vide quand le motif est imposé. */
  reasons: TerminationReason[]
  confirmLabel: string
  onClose: () => void
  onConfirm: (input: { reason: TerminationReason; note: string }) => Promise<void>
}) {
  return (
    <Dialog open={props.open} onOpenChange={(open) => (!open ? props.onClose() : undefined)}>
      <DialogContent className="sm:max-w-md">{props.open ? <Form {...props} /> : null}</DialogContent>
    </Dialog>
  )
}

function Form(props: Parameters<typeof TerminationDialog>[0]) {
  const [reason, setReason] = useState<TerminationReason>(props.reasons[0] ?? 'LOSS')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      await props.onConfirm({ reason, note: note.trim() })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'La résiliation a échoué.')
      setSubmitting(false)
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{props.title}</DialogTitle>
        <DialogDescription>{props.description}</DialogDescription>
      </DialogHeader>

      <div className="grid gap-4">
        {props.reasons.length > 0 ? (
          <div className="grid gap-1.5">
            <Label htmlFor="termination-reason">Motif</Label>
            <Select value={reason} onValueChange={(v) => setReason(v as TerminationReason)}>
              <SelectTrigger id="termination-reason" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {props.reasons.map((r) => (
                  <SelectItem key={r} value={r}>
                    {REASON_LABEL[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
        <div className="grid gap-1.5">
          <Label htmlFor="termination-note">Précision (facultatif)</Label>
          <Textarea id="termination-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} rows={3} />
        </div>
        {error ? (
          <Alert variant="destructive">
            <AlertTriangle />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={props.onClose} disabled={submitting}>
          Annuler
        </Button>
        <Button type="button" variant="destructive" onClick={() => void submit()} disabled={submitting}>
          {submitting ? 'Résiliation…' : props.confirmLabel}
        </Button>
      </DialogFooter>
    </>
  )
}
