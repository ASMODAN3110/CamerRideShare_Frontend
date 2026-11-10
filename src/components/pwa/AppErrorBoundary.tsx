import { Component, type ErrorInfo, type ReactNode } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { hardReset, recover } from '@/lib/pwa'

interface State {
  failed: boolean
}

/**
 * Filet de sécurité : une erreur d'affichage ne laisse plus un écran blanc. Une première fois l'application se répare seule
 * (caches et service worker vidés, rechargement depuis le réseau) ; si l'erreur persiste, un bouton propose de recharger.
 */
export default class AppErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Erreur inattendue de l’application', error, info.componentStack)
    recover()
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div role="alert" className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center">
        <h1 className="text-xl font-bold text-foreground">Un problème est survenu</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          L&apos;application n&apos;a pas pu s&apos;afficher correctement. Rechargez-la pour récupérer la dernière version.
        </p>
        <Button type="button" onClick={() => void hardReset()}>
          <RefreshCw />
          Recharger l&apos;application
        </Button>
      </div>
    )
  }
}
