import { toast } from 'sonner'
import { apiDownload } from './apiClient'

/**
 * Ouvre un contrat dans un nouvel onglet, avec le lecteur PDF du navigateur (bouton d'impression en haut à droite).
 * L'onglet est ouvert tout de suite, pendant le clic, sinon le navigateur bloque la fenêtre.
 */
export async function printContract(path: string): Promise<boolean> {
  const tab = window.open('', '_blank')
  try {
    const { blob } = await apiDownload(path)
    const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }))
    if (tab) tab.location.href = url
    else window.location.href = url
    window.setTimeout(() => URL.revokeObjectURL(url), 5 * 60_000)
    return true
  } catch (err) {
    tab?.close()
    toast.error(err instanceof Error && err.message ? err.message : "Impossible d'ouvrir le contrat")
    return false
  }
}

/** Télécharge un contrat en PDF et le propose à l'enregistrement ; signale l'échec à l'utilisateur. */
export async function downloadContract(path: string, fallbackName = 'contrat.pdf'): Promise<boolean> {
  try {
    const { blob, filename } = await apiDownload(path)
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename ?? fallbackName
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 10_000)
    return true
  } catch (err) {
    toast.error(err instanceof Error && err.message ? err.message : 'Téléchargement du contrat impossible')
    return false
  }
}
