export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Message d'une erreur d'API, ou le texte de secours. */
export function errorText(err: unknown, fallback: string) {
  return err instanceof Error && err.message ? err.message : fallback
}
