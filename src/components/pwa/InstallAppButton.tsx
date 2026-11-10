import { useState, type ReactNode } from 'react'
import { Download, Share, SquarePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { promptInstall, useInstallState } from '@/lib/pwa'

/**
 * Propose d'installer l'application (mobile et ordinateur). Rien n'est affiché si elle est déjà installée ou si le navigateur
 * ne sait pas l'installer. Sur iPhone / iPad, où il n'y a pas d'invite, une fenêtre explique le geste à faire.
 * `children(open)` laisse l'appelant choisir l'apparence (bouton de la barre latérale, bouton de la page de connexion…).
 */
export default function InstallAppButton(props: { children: (props: { onClick: () => void }) => ReactNode }) {
  const state = useInstallState()
  const [iosHelp, setIosHelp] = useState(false)
  if (state === 'installed' || state === 'unavailable') return null

  return (
    <>
      {props.children({ onClick: () => (state === 'available' ? void promptInstall() : setIosHelp(true)) })}
      <Dialog open={iosHelp} onOpenChange={setIosHelp}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Installer CamerRideShare</DialogTitle>
            <DialogDescription>Ajoutez l&apos;application à l&apos;écran d&apos;accueil de votre iPhone ou iPad :</DialogDescription>
          </DialogHeader>
          <ol className="grid gap-3 text-sm">
            <li className="flex items-center gap-3">
              <Share className="size-5 shrink-0 text-primary" />
              <span>Touchez le bouton <strong>Partager</strong> de Safari.</span>
            </li>
            <li className="flex items-center gap-3">
              <SquarePlus className="size-5 shrink-0 text-primary" />
              <span>Choisissez <strong>Sur l&apos;écran d&apos;accueil</strong>.</span>
            </li>
            <li className="flex items-center gap-3">
              <Download className="size-5 shrink-0 text-primary" />
              <span>Validez avec <strong>Ajouter</strong> : l&apos;application s&apos;ouvre ensuite en plein écran.</span>
            </li>
          </ol>
          <Button type="button" onClick={() => setIosHelp(false)}>
            Compris
          </Button>
        </DialogContent>
      </Dialog>
    </>
  )
}
