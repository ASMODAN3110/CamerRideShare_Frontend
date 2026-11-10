import { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { formatXafLabel } from '../lib/format'
import { getDriverReceivables } from '../services/terminationService'
import type { DriverReceivables } from '../types/api'

/**
 * Avertissement affiché quand on affecte un véhicule à un conducteur qui doit encore de l'argent d'une tournée précédente.
 * Il n'est pas bloquant : l'admin décide.
 */
export default function DriverArrearsWarning({ driverId }: { driverId: number }) {
  // résultat rattaché au conducteur demandé : changer de conducteur n'affiche jamais l'ancien avertissement
  const [result, setResult] = useState<{ driverId: number; data: DriverReceivables } | null>(null)

  useEffect(() => {
    if (driverId < 1) return
    let cancelled = false
    getDriverReceivables(driverId)
      .then((data) => {
        if (!cancelled) setResult({ driverId, data })
      })
      .catch(() => {
        // l'avertissement est une aide : son échec ne doit pas gêner l'affectation
      })
    return () => {
      cancelled = true
    }
  }, [driverId])

  const data = result && result.driverId === driverId ? result.data : null
  if (!data || data.outstandingAmount === 0) return null
  return (
    <Alert data-testid="driver-arrears-warning" className="border-warning/60 bg-warning/10">
      <AlertTriangle />
      <AlertDescription>
        Ce conducteur doit encore <strong>{formatXafLabel(data.outstandingAmount)}</strong> d&apos;une tournée précédente (
        {data.items.map((i) => `${i.matricule} : ${formatXafLabel(i.outstandingAmount)}`).join(', ')}). Vous pouvez quand même lui
        affecter ce véhicule.
      </AlertDescription>
    </Alert>
  )
}
