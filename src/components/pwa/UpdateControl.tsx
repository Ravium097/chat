import { useEffect, useState } from "react";
export const RELEASE = "2.0 · Visual Preview 01";
let registrationPromise: Promise<ServiceWorkerRegistration> | undefined;
function registration() {
  return (registrationPromise ??= navigator.serviceWorker
    .register("/sw.js", { updateViaCache: "none" })
    .catch((error) => {
      registrationPromise = undefined;
      throw error;
    }));
}
export function UpdateControl({ compact = false }: { compact?: boolean }) {
  const [ready, setReady] = useState(false),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  useEffect(() => {
    if (!("serviceWorker" in navigator) || import.meta.env.DEV) return;
    let disposed = false;
    let reg: ServiceWorkerRegistration | undefined;
    let worker: ServiceWorker | null = null;
    let previousController = navigator.serviceWorker.controller;
    const activated = () => {
      if (!disposed && previousController) setReady(true);
      previousController = navigator.serviceWorker.controller;
    };
    const state = () => {
      if (
        worker?.state === "installed" &&
        navigator.serviceWorker.controller &&
        !disposed
      )
        setReady(true);
    };
    const found = () => {
      worker?.removeEventListener("statechange", state);
      worker = reg?.installing ?? null;
      worker?.addEventListener("statechange", state);
    };
    const check = () => {
      if (document.visibilityState === "visible" && navigator.onLine)
        void reg?.update().catch(() => {});
    };
    navigator.serviceWorker.addEventListener("controllerchange", activated);
    document.addEventListener("visibilitychange", check);
    void registration()
      .then((r) => {
        if (disposed) return;
        reg = r;
        if (r.waiting) setReady(true);
        found();
        r.addEventListener("updatefound", found);
        check();
      })
      .catch(() => {
        if (!disposed)
          setMessage(
            "Update-Prüfung nicht verfügbar. Bitte später erneut versuchen.",
          );
      });
    return () => {
      disposed = true;
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        activated,
      );
      document.removeEventListener("visibilitychange", check);
      reg?.removeEventListener("updatefound", found);
      worker?.removeEventListener("statechange", state);
    };
  }, []);
  async function check() {
    if (!navigator.onLine) {
      setMessage("Offline. Deine gespeicherten Trainings bleiben verfügbar.");
      return;
    }
    if (!("serviceWorker" in navigator) || import.meta.env.DEV) {
      setMessage("Updates sind in der veröffentlichten App verfügbar.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const r = await registration();
      await r.update();
      if (r.waiting || r.installing) {
        setMessage("Update wird vorbereitet.");
        if (r.waiting) setReady(true);
      } else
        setMessage(
          "Prüfung abgeschlossen. Falls die Ansicht veraltet ist, kannst du sie neu laden.",
        );
    } catch {
      setMessage(
        "Update-Prüfung fehlgeschlagen. Bitte später erneut versuchen.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function reload() {
    if (
      !confirm(
        "SET neu laden? Beende zuerst deine aktuelle Eingabe und warte auf „Gespeichert“. Gespeicherte Workouts bleiben erhalten.",
      )
    )
      return;
    const r = await navigator.serviceWorker?.getRegistration();
    if (r?.waiting) {
      const controller = () => {
        navigator.serviceWorker.removeEventListener(
          "controllerchange",
          controller,
        );
        location.reload();
      };
      navigator.serviceWorker.addEventListener("controllerchange", controller);
      r.waiting.postMessage({ type: "SKIP_WAITING" });
    } else location.reload();
  }
  if (compact && !ready) return null;
  return (
    <section className="update-control" aria-label="App-Version und Updates">
      <p className="technical-label">SET / {RELEASE}</p>
      {ready && (
        <p role="status">
          Neue Version bereit. Gespeicherte Trainings bleiben erhalten.
        </p>
      )}
      <div className="update-actions">
        <button disabled={busy} onClick={() => void check()}>
          {busy ? "Wird geprüft …" : "Auf Updates prüfen"}
        </button>
        <button
          className={ready ? "primary" : ""}
          onClick={() =>
            void reload().catch(() =>
              setMessage("Neuladen fehlgeschlagen. Bitte erneut versuchen."),
            )
          }
        >
          {ready ? "Update öffnen" : "Ansicht neu laden"}
        </button>
      </div>
      {message && <p role="status">{message}</p>}
    </section>
  );
}
