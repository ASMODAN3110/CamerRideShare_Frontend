import { useState } from 'react'
import { FileText } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { downloadContract } from '../lib/contracts'
import { formatXaf } from '../lib/format'

export interface ContractPart {
  id: number
  amount: number
  createdAt: string
  closedAt?: string | null
  closeReason?: string | null
  loss?: number
  refundedAmount?: number
  transferredAmount?: number
}

/** Télécharge le contrat d'une part (un apport = un contrat), avec sa situation quand elle est résiliée. */
export default function InvestorPartContract({ part }: { part: ContractPart }) {
  const [busy, setBusy] = useState(false)
  return (
    <div className="flex min-w-0 max-w-full flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-auto min-w-0 max-w-full whitespace-normal py-1.5 text-left"
        disabled={busy}
        onClick={() => {
          setBusy(true)
          void downloadContract(`/investor/contracts/${part.id}`).finally(() => setBusy(false))
        }}
      >
        <FileText />
        {busy ? 'Génération…' : `Contrat · ${formatXaf(part.amount)} · ${new Date(part.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`}
      </Button>
      {part.closedAt ? (
        <Badge variant={part.closeReason === 'LOSS' ? 'red' : 'secondary'} className="text-[10px]">
          {part.closeReason === 'LOSS' ? `Perte · ${formatXaf(part.loss ?? 0)} XAF` : 'Contrat résilié'}
        </Badge>
      ) : null}
      {part.closedAt && (part.refundedAmount || part.transferredAmount) ? (
        <span className="text-[11px] text-muted-foreground">
          {part.refundedAmount ? `Remboursé ${formatXaf(part.refundedAmount)} XAF` : ''}
          {part.refundedAmount && part.transferredAmount ? ' · ' : ''}
          {part.transferredAmount ? `Réaffecté ${formatXaf(part.transferredAmount)} XAF` : ''}
        </span>
      ) : null}
    </div>
  )
}
