import { useState } from 'react'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import AdminLayout from '@/components/admin/AdminLayout'
import LatePaymentsList from '@/components/LatePaymentsList'
import ReceivablesCard from '@/components/ReceivablesCard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatXafLabel } from '@/lib/format'
import { getAdminLatePayments } from '../services/latePaymentsService'
import type { LatePaymentsResponse } from '../types/api'

type RetardsPageProps = {
  theme: 'light' | 'dark'
  onToggleTheme: () => void
}

export default function RetardsPage({ theme, onToggleTheme }: RetardsPageProps) {
  const [summary, setSummary] = useState<LatePaymentsResponse['summary'] | null>(null)

  return (
    <AdminLayout
      title="Retards de paiement"
      description="Historique des semaines de versement en retard des chauffeurs. Chaque retard ajoute une semaine à la fin de leur calendrier."
      theme={theme}
      onToggleTheme={onToggleTheme}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="py-4">
          <CardContent className="flex items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-md bg-destructive/10 text-destructive">
              <AlertTriangle className="size-5" />
            </div>
            <div className="min-w-0">
              <CardDescription>À régulariser</CardDescription>
              <div className="flex flex-wrap items-baseline gap-x-2">
                <CardTitle className="text-2xl font-extrabold tabular-nums">{summary?.open ?? 0}</CardTitle>
                <span className="text-sm font-semibold text-muted-foreground tabular-nums">{formatXafLabel(summary?.openAmount ?? 0, true)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardContent className="flex items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-md bg-success/12 text-success-foreground">
              <CheckCircle2 className="size-5" />
            </div>
            <div className="min-w-0">
              <CardDescription>Régularisés</CardDescription>
              <CardTitle className="text-2xl font-extrabold tabular-nums">{summary?.settled ?? 0}</CardTitle>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Historique</CardTitle>
          <CardDescription>Un retard reste dans la liste après régularisation.</CardDescription>
        </CardHeader>
        <CardContent>
          <LatePaymentsList fetcher={getAdminLatePayments} showDriver onSummary={setSummary} />
        </CardContent>
      </Card>

      <ReceivablesCard />
    </AdminLayout>
  )
}
