import type { PaymentMethod } from '@/types/api'

/**
 * Icône de chaque moyen de paiement, aux couleurs de la marque : carré orange pour Orange Money, ovale jaune pour MTN Money,
 * billet blanc sur fond vert pour les espèces. Dessinée en traits (sans texte SVG) pour rester nette à toutes les tailles.
 */
export default function PaymentMethodIcon({ method, height = 24 }: { method: PaymentMethod; /** Hauteur en pixels : la taille est fixée en ligne pour échapper au style des listes déroulantes, qui réduit les icônes à 16 px. */ height?: number }) {
  const square = { height, width: height }
  if (method === 'ORANGE_MONEY') {
    return (
      <svg viewBox="0 0 32 32" style={square} className="shrink-0" aria-hidden="true" focusable="false" data-testid="icon-orange-money">
        <rect width="32" height="32" rx="6" fill="#FF7900" />
        <g fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="10.5" cy="16" r="4.6" />
          <polyline points="17.5,21 17.5,11 21.5,17 25.5,11 25.5,21" />
        </g>
      </svg>
    )
  }
  if (method === 'MTN_MONEY') {
    return (
      <svg viewBox="0 0 48 32" style={{ height, width: Math.round(height * 1.5) }} className="shrink-0" aria-hidden="true" focusable="false" data-testid="icon-mtn-money">
        <ellipse cx="24" cy="16" rx="23" ry="15" fill="#FFCB05" />
        <g fill="none" stroke="#1B1B1B" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="8,22 8,10 13,17 18,10 18,22" />
          <polyline points="21,10 31,10" />
          <polyline points="26,10 26,22" />
          <polyline points="34,22 34,10 41,22 41,10" />
        </g>
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 32 32" style={square} className="shrink-0" aria-hidden="true" focusable="false" data-testid="icon-cash">
      <rect width="32" height="32" rx="6" fill="#059669" />
      <g fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5.5" y="9.5" width="21" height="13" rx="2.5" />
        <circle cx="16" cy="16" r="3" />
        <path d="M9.5 16h.01M22.5 16h.01" />
      </g>
    </svg>
  )
}
