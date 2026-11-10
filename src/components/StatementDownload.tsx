import { useState } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { downloadContract } from '../lib/contracts'
import { customRangeError, PERIOD_LABEL, presetRange, statementPath, type PeriodPreset, type PeriodRange } from '../lib/statementPeriods'

const PRESETS = Object.keys(PERIOD_LABEL) as PeriodPreset[]

const frDay = (key: string) => new Date(`${key}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

/** Résumé de la période choisie, affiché sous le sélecteur. */
function describe(range: PeriodRange): string {
  if (range.from && range.to) return `Du ${frDay(range.from)} au ${frDay(range.to)}`
  if (range.from) return `Du ${frDay(range.from)} à aujourd'hui`
  if (range.to) return `Depuis l'origine jusqu'au ${frDay(range.to)}`
  return "Depuis l'origine jusqu'à aujourd'hui"
}

/**
 * Relevé PDF de l'investisseur : il choisit la période (tout l'historique, mois, trimestre, année ou dates libres),
 * le serveur produit le PDF avec le capital, les sommes perçues, les reversements et le détail des parts.
 */
export default function StatementDownload() {
  const [open, setOpen] = useState(false)
  const [preset, setPreset] = useState<PeriodPreset>('ALL')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [busy, setBusy] = useState(false)

  const range: PeriodRange = preset === 'CUSTOM' ? { ...(from ? { from } : {}), ...(to ? { to } : {}) } : presetRange(preset, new Date())
  const error = preset === 'CUSTOM' ? customRangeError(range) : null

  const download = async () => {
    setBusy(true)
    const ok = await downloadContract(statementPath(range), 'releve-investisseur.pdf')
    setBusy(false)
    if (ok) setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button">
          <Download className="h-4 w-4" />
          Télécharger Relevé PDF
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 max-w-[calc(100vw-2rem)] space-y-4 p-4">
        <div className="grid gap-1.5">
          <Label htmlFor="statement-period">Période du relevé</Label>
          <Select value={preset} onValueChange={(v) => setPreset(v as PeriodPreset)}>
            <SelectTrigger id="statement-period" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRESETS.map((p) => (
                <SelectItem key={p} value={p}>
                  {PERIOD_LABEL[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {preset === 'CUSTOM' ? (
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="statement-from">Du</Label>
              <Input id="statement-from" type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="statement-to">Au</Label>
              <Input id="statement-to" type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} />
            </div>
          </div>
        ) : null}

        <p className="text-xs text-muted-foreground" data-testid="statement-range">
          {error ?? describe(range)}
        </p>
        {error ? <p className="sr-only" role="alert">{error}</p> : null}

        <Button type="button" className="w-full" disabled={busy || error !== null} onClick={() => void download()}>
          <Download className="h-4 w-4" />
          {busy ? 'Génération du relevé…' : 'Télécharger le PDF'}
        </Button>
      </PopoverContent>
    </Popover>
  )
}
