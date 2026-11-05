import { useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../data";
import {
  addPersonalTemplates,
  personalPlans,
  planId,
} from "../../services/personalTemplates";
export function PersonalTemplates() {
  const existing = useLiveQuery(() =>
    db.workouts.bulkGet(personalPlans.map((p) => planId(p.key))),
  );
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const complete = existing?.every(Boolean);
  return (
    <details className="personal-templates">
      <summary>Deine Push- & Pull-Vorlagen</summary>
      <p>
        Die Werte aus deinen Screenshots. Als bearbeitbare Vorlagen übernehmen.
      </p>
      {personalPlans.map((plan) => (
        <details key={plan.key}>
          <summary>
            {plan.name} · {plan.exercises.length} Übungen ·{" "}
            {plan.exercises.reduce((n, e) => n + e.sets.length, 0)} Sätze
          </summary>
          <ol>
            {plan.exercises.map((e) => (
              <li key={e.name}>
                <strong>{e.name}</strong>
                <p>
                  {e.sets
                    .map(
                      ([w, r]) =>
                        `${w === null ? "Körpergewicht" : `${w} kg`} × ${r}`,
                    )
                    .join(" / ")}
                </p>
                {e.rest !== undefined && <p>Pause: {e.rest} Sekunden</p>}
                {e.notes && <p>{e.notes}</p>}
              </li>
            ))}
          </ol>
        </details>
      ))}
      <p>
        <small>
          SET unterstützt derzeit eine Pause pro Übung. Die abweichenden
          Satzpausen bei Tricep Pushdown und Bicep Curl bleiben in den
          Übungsnotizen erhalten. Bei fehlenden Pausen gilt deine Standardpause.
        </small>
      </p>
      <button
        disabled={busy || !existing || complete}
        onClick={async () => {
          if (lock.current) return;
          lock.current = true;
          setBusy(true);
          try {
            const n = await addPersonalTemplates();
            setMessage(
              n ? `${n} Vorlagen gespeichert.` : "Vorlagen bereits vorhanden.",
            );
          } catch {
            setMessage("Speichern fehlgeschlagen. Bitte erneut versuchen.");
          } finally {
            lock.current = false;
            setBusy(false);
          }
        }}
      >
        {busy
          ? "Wird gespeichert …"
          : complete
            ? "Vorlagen übernommen"
            : "Push & Pull als Vorlagen speichern"}
      </button>
      <p role="status">{message}</p>
    </details>
  );
}
