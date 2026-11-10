export {}

declare global {
  interface Window {
    /** Posé par main.tsx quand l'application a démarré ; index.html répare l'installation s'il manque après 10 s. */
    __crsBooted?: boolean
  }
}
