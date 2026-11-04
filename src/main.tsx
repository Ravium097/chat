import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  useNavigate,
  useParams,
  useLocation,
  Link,
} from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import {
  Home,
  Dumbbell,
  CalendarDays,
  ChartNoAxesCombined,
  Settings as Gear,
  Plus,
  ArrowRight,
} from "lucide-react";
import {
  format,
  startOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  isSameDay,
} from "date-fns";
import { de } from "date-fns/locale";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
} from "recharts";
import {
  db,
  init,
  id,
  defaults,
  emptySet,
  volume,
  count,
  exportData,
  restore,
  backupSchema,
  muscles,
  equipment,
  type Workout,
  type Item,
  type Exercise,
} from "./data";
import { recognize } from "./ocr";
import "./style.css";
const day = (d = new Date()) => format(d, "yyyy-MM-dd");
const fmt = (n: number) =>
  n.toLocaleString("de-DE", { maximumFractionDigits: 1 });
const error = (e: unknown) =>
  alert(
    e instanceof Error
      ? e.message
      : "Speichern fehlgeschlagen. Bitte Backup erstellen.",
  );
function App() {
  const { pathname } = useLocation();
  useEffect(() => { document.querySelector("main")?.scrollTo(0, 0); }, [pathname]);
  const settings = useLiveQuery(() => db.settings.get("settings")) ?? defaults;
  const [now, tick] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => tick(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const remaining =
    settings.paused ??
    (settings.timerEnd
      ? Math.max(0, Math.ceil((settings.timerEnd - now) / 1000))
      : null);
  return (
    <>
      <main className={["/", "/training", "/history", "/stats"].includes(pathname) ? "overview" : ""}>
        <header>
          <Link to="/" className="logo">
            SET<span>●</span>
          </Link>
          <Link aria-label="Einstellungen" to="/settings">
            <Gear />
          </Link>
        </header>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/training" element={<Training />} />
          <Route path="/workout/:wid" element={<Editor />} />
          <Route path="/library" element={<Library />} />
          <Route path="/history" element={<History />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/import" element={<Import />} />
        </Routes>
      </main>
      <footer className="app-dock">
      {remaining !== null && (
        <aside className="timer">
          <strong>
            {remaining === 0
              ? "Pause beendet"
              : `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`}
          </strong>
          <button
            onClick={() =>
              db.settings.update(
                "settings",
                settings.paused !== null
                  ? { paused: null, timerEnd: Date.now() + remaining * 1000 }
                  : { paused: remaining, timerEnd: null },
              )
            }
          >
            {settings.paused !== null ? "Weiter" : "Pause"}
          </button>
          <button
            onClick={() =>
              db.settings.update(
                "settings",
                settings.paused !== null
                  ? { paused: remaining + 30 }
                  : { timerEnd: Date.now() + (remaining + 30) * 1000 },
              )
            }
          >
            +30 s
          </button>
          <button
            onClick={() =>
              db.settings.update("settings", { paused: null, timerEnd: null })
            }
          >
            ×
          </button>
        </aside>
      )}
      <nav>
        {[
          [Home, "/", "Home"],
          [Dumbbell, "/training", "Training"],
          [CalendarDays, "/history", "Verlauf"],
          [ChartNoAxesCombined, "/stats", "Statistik"],
        ].map(([Icon, to, label]) => {
          const C = Icon as typeof Home;
          return (
            <NavLink key={String(to)} to={String(to)}>
              <C size={21} />
              <span>{String(label)}</span>
            </NavLink>
          );
        })}
      </nav>
      </footer>
    </>
  );
}
function Dashboard() {
  const all = useLiveQuery(() => db.workouts.toArray()) ?? [];
  const done = all
    .filter((w) => w.status === "completed")
    .sort((a, b) => b.date.localeCompare(a.date));
  const active = all.find((w) => w.status === "active");
  return (
    <>
      <p className="eyebrow">
        {format(new Date(), "EEEE, d. MMMM", { locale: de })}
      </p>
      <h1>
        Dein Training.
        <br />
        <span>Dein Fortschritt.</span>
      </h1>
      <p className="dashboard-tagline">Ein Satz nach dem anderen.</p>
      <div className="metrics">
        <article>
          <b>{done.length}</b>
          <small>Workouts gesamt</small>
        </article>
        <article>
          <b>{fmt(done.reduce((s, w) => s + volume(w), 0))}</b>
          <small>Volumen · kg</small>
        </article>
        <article>
          <b>
            {
              done.filter(
                (w) =>
                  w.date >= day(startOfWeek(new Date(), { weekStartsOn: 1 })) &&
                  w.date <= day(),
              ).length
            }
          </b>
          <small>Diese Woche</small>
        </article>
      </div>
      <Link
        className="primary action"
        to={active ? `/workout/${active.id}` : "/training"}
      >
        <Dumbbell />
        {active ? "Workout fortsetzen" : "Workout starten"}
        <ArrowRight />
      </Link>
      <h2>Letztes Workout</h2>
      {done[0] ? (
        <WorkoutCard w={done[0]} />
      ) : (
        <article className="empty">
          <Dumbbell size={36} />
          <h3>Dein erster Satz wartet.</h3>
          <p>
            Hier beginnt deine Trainingsgeschichte.
            <br />
            Starte dein erstes Workout.
          </p>
        </article>
      )}

    </>
  );
}
function WorkoutCard({ w }: { w: Workout }) {
  return (
    <Link to={`/workout/${w.id}`}>
      <article>
        <small>{w.date}</small>
        <h3>{w.name}</h3>
        <p>
          {w.exercises.length} Übungen · {count(w)} Sätze · {fmt(volume(w))} kg
          {w.duration !== null ? ` · ${Math.round(w.duration / 60)} min` : ""}
        </p>
      </article>
    </Link>
  );
}
function Training() {
  const ws = useLiveQuery(() => db.workouts.toArray()) ?? [];
  const navigate = useNavigate();
  async function start(template?: Workout) {
    const active = ws.find((w) => w.status === "active");
    if (active) {
      navigate(`/workout/${active.id}`);
      return;
    }
    const w: Workout = {
      id: id(),
      name: template?.name ?? "Freies Workout",
      date: day(),
      started: Date.now(),
      duration: null,
      status: "active",
      exercises: template
        ? structuredClone(template.exercises).map((e) => ({
            ...e,
            id: id(),
            sets: e.sets.map((s) => ({ ...s, id: id(), completed: false })),
          }))
        : [],
    };
    await db.workouts.add(w);
    navigate(`/workout/${w.id}`);
  }
  return (
    <>
      <p className="eyebrow">ZEIT FÜR DICH</p>
      <h1>Training</h1>
      <button className="primary action" onClick={() => start().catch(error)}>
        <Plus />
        Freies Workout starten
      </button>
      <div className="two">
        <Link className="tile" to="/import">
          Screenshot importieren <ArrowRight />
        </Link>
        <Link className="tile" to="/library">
          Übungsbibliothek <Dumbbell />
        </Link>
      </div>
      <h2>Deine Vorlagen</h2>
      {ws
        .filter((w) => w.status === "template")
        .map((w) => (
          <article key={w.id}>
            <h3>{w.name}</h3>
            <p>{w.exercises.length} Übungen</p>
            <button className="primary" onClick={() => start(w).catch(error)}>
              Starten
            </button>{" "}
            <Link className="button" to={`/workout/${w.id}`}>
              Bearbeiten
            </Link>
            <button
              onClick={() =>
                db.workouts
                  .add({
                    ...structuredClone(w),
                    id: id(),
                    name: w.name + " Kopie",
                  })
                  .catch(error)
              }
            >
              Duplizieren
            </button>
          </article>
        ))}
      <button
        onClick={async () => {
          const w: Workout = {
            id: id(),
            name: "Neue Vorlage",
            date: day(),
            status: "template",
            started: null,
            duration: null,
            exercises: [],
          };
          await db.workouts.add(w);
          navigate(`/workout/${w.id}`);
        }}
      >
        ＋ Vorlage erstellen
      </button>
    </>
  );
}
export function Numeric({value,onChange,step,label}:{value:number|null;onChange:(v:number|null)=>void;step:number;label:string}) {
 const [draft,setDraft]=useState(value===null?'':String(value));
 const [focused,setFocused]=useState(false);
 useEffect(()=>{if(!focused)setDraft(value===null?'':String(value))},[value,focused]);
 function change(n:number){setDraft(String(n));onChange(n)}
 return <div className="numeric"><button aria-label={`${label} verringern`} onClick={()=>change(Math.max(0,(value??0)-step))}>−</button><input aria-label={label} inputMode={step===1?'numeric':'decimal'} value={draft} placeholder="–" onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)} onChange={e=>{const text=e.target.value;const normalized=text.replace(',','.');if(normalized===''||(step===1?/^\d+$/:/^\d+(\.\d*)?$/).test(normalized)){setDraft(text);onChange(normalized===''?null:Number(normalized))}}}/><button aria-label={`${label} erhöhen`} onClick={()=>change((value??0)+step)}>+</button></div>
}
function WorkoutFields({
  w,
  save,
}: {
  w: Workout;
  save: (w: Workout) => void;
}) {
  const ex = useLiveQuery(() => db.exercises.toArray()) ?? [];
  const [query, setQuery] = useState("");
  const modify = (idx: number, e: Item) =>
    save({ ...w, exercises: w.exercises.map((x, i) => (i === idx ? e : x)) });
  return (
    <>
      <label>
        Name
        <input
          value={w.name}
          onChange={(e) => save({ ...w, name: e.target.value })}
        />
      </label>
      <label>
        Trainingsdatum
        <input
          type="date"
          value={w.date}
          onChange={(e) => save({ ...w, date: e.target.value })}
        />
      </label>
      {w.exercises.map((e, i) => (
        <details key={e.id} open>
          <summary>
            {e.name}
            <small>
              {e.sets.filter((s) => s.completed).length}/{e.sets.length} Sätze
            </small>
          </summary>
          <input
            aria-label="Übungsname"
            value={e.name}
            onChange={(ev) => modify(i, { ...e, name: ev.target.value })}
          />
          <div className="setheading">
            <span>Satz</span>
            <span>Gewicht · kg</span>
            <span>Wdh.</span>
            <span>✓</span>
          </div>
          {e.sets.map((s, j) => {
            const update = (patch: Partial<typeof s>) =>
              modify(i, {
                ...e,
                sets: e.sets.map((x) =>
                  x.id === s.id ? { ...x, ...patch } : x,
                ),
              });
            return (
              <div className={`set ${s.completed ? "done" : ""}`} key={s.id}>
                <button
                  aria-label="Satz löschen"
                  onClick={() =>
                    modify(i, {
                      ...e,
                      sets: e.sets.filter((x) => x.id !== s.id),
                    })
                  }
                >
                  {j + 1}
                  <small>−</small>
                </button>
                <Numeric
                  label="Gewicht"
                  step={2.5}
                  value={s.weight}
                  onChange={(weight) => update({ weight })}
                />
                <Numeric
                  label="Wiederholungen"
                  step={1}
                  value={s.reps}
                  onChange={(reps) => update({ reps })}
                />
                <input
                  aria-label="Satz abgeschlossen"
                  type="checkbox"
                  checked={s.completed}
                  onChange={async (ev) => {
                    const completed = ev.target.checked;
                    update({ completed });
                    const cfg = await db.settings.get("settings");
                    if (completed && w.status === "active" && cfg?.auto)
                      await db.settings.update("settings", {
                        timerEnd:
                          Date.now() +
                          (ex.find((x) => x.id === e.exerciseId)?.rest ??
                            cfg.rest) *
                            1000,
                        paused: null,
                      });
                  }}
                />
              </div>
            );
          })}
          <button
            onClick={() => modify(i, { ...e, sets: [...e.sets, emptySet()] })}
          >
            ＋ Satz
          </button>
          <button
            disabled={i === 0}
            onClick={() => {
              const es = [...w.exercises];
              [es[i - 1], es[i]] = [es[i], es[i - 1]];
              save({ ...w, exercises: es });
            }}
          >
            ↑
          </button>
          <button
            onClick={() =>
              save({
                ...w,
                exercises: w.exercises.filter((x) => x.id !== e.id),
              })
            }
          >
            Übung entfernen
          </button>
        </details>
      ))}
      <article>
        <label>
          Übung hinzufügen
          <input
            placeholder="Bibliothek durchsuchen …"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <select
          aria-label="Übung auswählen"
          value=""
          onChange={(ev) => {
            const e = ex.find((x) => x.id === ev.target.value)!;
            save({
              ...w,
              exercises: [
                ...w.exercises,
                {
                  id: id(),
                  exerciseId: e.id,
                  name: e.name,
                  sets: [emptySet()],
                },
              ],
            });
          }}
        >
          <option value="">Übung auswählen</option>
          {ex
            .filter((e) => e.name.toLowerCase().includes(query.toLowerCase()))
            .map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
        </select>
        <Link to="/library">Bibliothek verwalten →</Link>
      </article>
    </>
  );
}
function Editor() {
  const { wid } = useParams();
  const w = useLiveQuery(() => db.workouts.get(wid!), [wid]);
  const nav = useNavigate();
  const [msg, setMsg] = useState("");
  if (!w) return <p>Workout wird geladen …</p>;
  const save = (next: Workout) => {
    db.workouts
      .put(next)
      .then(() => setMsg("Gespeichert"))
      .catch((e) => setMsg(String(e)));
  };
  return (
    <>
      <h1>
        {w.status === "template"
          ? "Vorlage"
          : w.status === "active"
            ? "Im Training"
            : "Workout"}
      </h1>
      <p>
        {count(w)} abgeschlossene Sätze · {fmt(volume(w))} kg ·{" "}
        {w.started && w.status === "active"
          ? Math.floor((Date.now() - w.started) / 60000)
          : Math.round((w.duration ?? 0) / 60)}{" "}
        min
      </p>
      <small role="status">{msg}</small>
      <WorkoutFields w={w} save={save} />
      {w.status === "active" && (
        <button
          className="primary action"
          onClick={async () => {
            if (!w.name.trim() || !w.date)
              return error(Error("Name und Datum fehlen"));
            if (
              confirm(
                `Workout abschließen? ${w.exercises.length} Übungen, ${count(w)} Sätze, ${fmt(volume(w))} kg.`,
              )
            ) {
              await db.transaction("rw", db.workouts, db.settings, async () => {
                await db.workouts.put({
                  ...w,
                  status: "completed",
                  duration: w.started
                    ? Math.floor((Date.now() - w.started) / 1000)
                    : null,
                });
                await db.settings.update("settings", {
                  timerEnd: null,
                  paused: null,
                });
              });
              nav("/history");
            }
          }}
        >
          Workout abschließen
        </button>
      )}
      <button
        onClick={async () => {
          if (confirm("Dieses Workout endgültig löschen?")) {
            await db.workouts.delete(w.id);
            nav("/training");
          }
        }}
      >
        Workout löschen
      </button>
    </>
  );
}
function Library() {
  const es = useLiveQuery(() => db.exercises.toArray()) ?? [];
  const [q, Q] = useState(""),
    [m, M] = useState(""),
    [eq, E] = useState(""),
    [fav, F] = useState(false);
  const [edit, Edit] = useState<Exercise | null>(null);
  return (
    <>
      <h1>Übungen</h1>
      <input
        placeholder="Übung suchen"
        value={q}
        onChange={(e) => Q(e.target.value)}
      />
      <div className="two">
        <select value={m} onChange={(e) => M(e.target.value)}>
          <option value="">Alle Muskelgruppen</option>
          {muscles.map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <select value={eq} onChange={(e) => E(e.target.value)}>
          <option value="">Alle Geräte</option>
          {equipment.map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
      </div>
      <button onClick={() => F(!fav)}>
        {fav ? "★ Favoriten" : "☆ Alle Übungen"}
      </button>
      <button
        onClick={() =>
          Edit({
            id: id(),
            name: "",
            muscle: "Sonstige",
            equipment: "Sonstige",
            favorite: false,
            notes: "",
          })
        }
      >
        ＋ Eigene Übung
      </button>
      {edit && (
        <article>
          <h2>Übung bearbeiten</h2>
          <input
            aria-label="Name"
            value={edit.name}
            onChange={(e) => Edit({ ...edit, name: e.target.value })}
          />
          <select
            value={edit.muscle}
            onChange={(e) => Edit({ ...edit, muscle: e.target.value })}
          >
            {muscles.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
          <select
            value={edit.equipment}
            onChange={(e) => Edit({ ...edit, equipment: e.target.value })}
          >
            {equipment.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
          <input
            placeholder="Notizen"
            value={edit.notes}
            onChange={(e) => Edit({ ...edit, notes: e.target.value })}
          />
          <label>
            Individuelle Pause (Sekunden)
            <input
              type="number"
              min="1"
              value={edit.rest ?? ""}
              onChange={(e) =>
                Edit({
                  ...edit,
                  rest: e.target.value
                    ? Math.max(1, Number(e.target.value))
                    : undefined,
                })
              }
            />
          </label>
          <button
            className="primary"
            disabled={!edit.name.trim()}
            onClick={() =>
              db.exercises
                .put(edit)
                .then(() => Edit(null))
                .catch(error)
            }
          >
            Speichern
          </button>
          <button onClick={() => Edit(null)}>Abbrechen</button>
        </article>
      )}
      {es
        .filter(
          (e) =>
            e.name.toLowerCase().includes(q.toLowerCase()) &&
            (!m || e.muscle === m) &&
            (!eq || e.equipment === eq) &&
            (!fav || e.favorite),
        )
        .map((e) => (
          <article key={e.id}>
            <h3>{e.name}</h3>
            <small>
              {e.muscle} · {e.equipment}
            </small>
            <div>
              <button
                onClick={() =>
                  db.exercises.update(e.id, { favorite: !e.favorite })
                }
              >
                {e.favorite ? "★" : "☆"}
              </button>
              <button onClick={() => Edit(e)}>Bearbeiten</button>
              <button
                onClick={() => {
                  if (
                    confirm(
                      "Übung löschen? Historische Workouts bleiben erhalten.",
                    )
                  )
                    db.exercises.delete(e.id);
                }}
              >
                Löschen
              </button>
            </div>
          </article>
        ))}
    </>
  );
}
function History() {
  const [month, Month] = useState(new Date()),
    [selected, Select] = useState(day());
  const ws =
    useLiveQuery(() =>
      db.workouts.where("status").equals("completed").toArray(),
    ) ?? [];
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }),
    end: endOfMonth(month),
  });
  return (
    <>
      <h1>Verlauf</h1>
      <article>
        <div className="row">
          <button onClick={() => Month(addMonths(month, -1))}>←</button>
          <h3>{format(month, "MMMM yyyy", { locale: de })}</h3>
          <button onClick={() => Month(addMonths(month, 1))}>→</button>
        </div>
        <div className="calendar">
          {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((x) => (
            <small key={x}>{x}</small>
          ))}
          {days.map((d) => (
            <button
              className={`${selected === day(d) ? "selected" : ""} ${isSameDay(d, new Date()) ? "today" : ""}`}
              key={day(d)}
              onClick={() => Select(day(d))}
            >
              {format(d, "d")}
              <small>{ws.some((w) => w.date === day(d)) ? "●" : " "}</small>
            </button>
          ))}
        </div>
      </article>
      <h2>
        {format(new Date(selected + "T12:00:00"), "d. MMMM yyyy", {
          locale: de,
        })}
      </h2>
      {ws
        .filter((w) => w.date === selected)
        .map((w) => (
          <WorkoutCard key={w.id} w={w} />
        ))}
      {!ws.some((w) => w.date === selected) && (
        <p>Für diesen Tag ist kein Workout gespeichert.</p>
      )}
    </>
  );
}
function Stats() {
  const ws =
    useLiveQuery(() =>
      db.workouts.where("status").equals("completed").toArray(),
    ) ?? [];
  const [range, R] = useState("90"),
    [exercise, E] = useState(""),
    [bucket, B] = useState("week");
  const filtered = ws
    .filter(
      (w) =>
        range === "all" ||
        new Date(w.date).getTime() >= Date.now() - Number(range) * 86400000,
    )
    .sort((a, b) => a.date.localeCompare(b.date));
  const groups = new Map<
    string,
    { date: string; volume: number; workouts: number }
  >();
  filtered.forEach((w) => {
    const d = new Date(w.date + "T12:00:00");
    const key = day(
      bucket === "week" ? startOfWeek(d, { weekStartsOn: 1 }) : startOfMonth(d),
    );
    const g = groups.get(key) ?? { date: key, volume: 0, workouts: 0 };
    g.volume += volume(w);
    g.workouts++;
    groups.set(key, g);
  });
  const names = [...new Set(ws.flatMap((w) => w.exercises.map((e) => e.name)))];
  const selected = exercise || names[0];
  const sets = filtered.flatMap((w) =>
    w.exercises
      .filter((e) => e.name === selected)
      .flatMap((e) => e.sets.filter((s) => s.completed)),
  );
  const strength = filtered.flatMap((w) => {
    const weights = w.exercises
      .filter((e) => e.name === selected)
      .flatMap((e) =>
        e.sets
          .filter((s) => s.completed && s.weight !== null)
          .map((s) => s.weight!),
      );
    return weights.length
      ? [{ date: w.date, weight: Math.max(...weights) }]
      : [];
  });
  if (!filtered.length) return <><h1>Dein Fortschritt</h1><select aria-label="Zeitraum" value={range} onChange={e=>R(e.target.value)}><option value="30">30 Tage</option><option value="90">90 Tage</option><option value="365">1 Jahr</option><option value="all">Gesamt</option></select><div className="metrics"><article><b>0</b><small>Workouts</small></article><article><b>0</b><small>Volumen · kg</small></article></div><article className="empty"><ChartNoAxesCombined size={32}/><h2>Noch keine Trainingsdaten</h2><p>Volumen, Häufigkeit, Kraftentwicklung und Rekorde erscheinen nach deinem ersten abgeschlossenen Workout im gewählten Zeitraum.</p><Link className="button primary" to="/training">Zum Training</Link></article></>;
  return (
    <>
      <h1>Dein Fortschritt</h1>
      <select value={range} onChange={(e) => R(e.target.value)}>
        <option value="30">30 Tage</option>
        <option value="90">90 Tage</option>
        <option value="365">1 Jahr</option>
        <option value="all">Gesamt</option>
      </select>
      <div className="metrics">
        <article>
          <b>{filtered.length}</b>
          <small>Workouts</small>
        </article>
        <article>
          <b>{fmt(filtered.reduce((s, w) => s + volume(w), 0))}</b>
          <small>Volumen · kg</small>
        </article>
      </div>
      <select value={bucket} onChange={(e) => B(e.target.value)}>
        <option value="week">Pro Woche</option>
        <option value="month">Pro Monat</option>
      </select>
      {(["volume", "workouts"] as const).map((key) => (
        <article key={key}>
          <h2>
            {key === "volume" ? "Trainingsvolumen" : "Trainingshäufigkeit"}
          </h2>
          {groups.size ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={[...groups.values()]}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis width={45} />
                <Tooltip />
                <Bar dataKey={key} fill="#171717" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p>Deine Diagramme entstehen mit deinem ersten Workout.</p>
          )}
        </article>
      ))}
      <article>
        <h2>Kraftentwicklung</h2>
        <select value={selected ?? ""} onChange={(e) => E(e.target.value)}>
          {names.map((n) => (
            <option key={n}>{n}</option>
          ))}
        </select>
        {strength.length ? (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={strength}>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis />
              <Tooltip />
              <Line dataKey="weight" stroke="#171717" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p>Noch keine abgeschlossenen gewichteten Sätze.</p>
        )}
        <h3>Persönliche Rekorde · gewählter Zeitraum</h3>
        {sets.length ? (
          <p>
            {fmt(Math.max(...sets.map((s) => s.weight ?? 0)))} kg ·{" "}
            {Math.max(...sets.map((s) => s.reps ?? 0))} Wdh. ·{" "}
            {fmt(Math.max(...sets.map((s) => (s.weight ?? 0) * (s.reps ?? 0))))}{" "}
            kg Satzvolumen
          </p>
        ) : (
          <p>Noch keine Rekorde.</p>
        )}
      </article>
    </>
  );
}
function Settings() {
  const s = useLiveQuery(() => db.settings.get("settings")) ?? defaults;
  return (
    <>
      <h1>Einstellungen</h1>
      <article>
        <h2>Pausentimer</h2>
        <label>
          Standardpause · Sekunden
          <input
            type="number"
            min="1"
            max="3600"
            value={s.rest}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (n >= 1 && n <= 3600)
                db.settings.update("settings", { rest: n });
            }}
          />
        </label>
        <label>
          <input
            type="checkbox"
            checked={s.auto}
            onChange={(e) =>
              db.settings.update("settings", { auto: e.target.checked })
            }
          />{" "}
          Automatisch nach Satzabschluss starten
        </label>
        <p>
          Gewichtseinheit: kg. Körpergewicht ohne Zusatzgewicht als 0 kg
          erfassen.
        </p>
      </article>
      <article>
        <h2>Daten & Backup</h2>
        <button
          className="primary"
          onClick={async () => {
            const blob = new Blob(
              [JSON.stringify(await exportData(), null, 2)],
              { type: "application/json" },
            );
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `SET-backup-${day()}.json`;
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 10000);
          }}
        >
          JSON-Backup exportieren
        </button>
        <label className="button">
          JSON-Backup importieren
          <input
            type="file"
            accept="application/json,.json"
            onChange={async (e) => {
              try {
                const f = e.target.files?.[0];
                if (!f) return;
                if (f.size > 20 * 1024 * 1024)
                  throw Error("Backup ist zu groß");
                const b = backupSchema.parse(JSON.parse(await f.text()));
                if (
                  confirm(
                    `${b.workouts.length} Workouts und ${b.exercises.length} Übungen wiederherstellen? Alle vorhandenen Daten werden ersetzt.`,
                  )
                ) {
                  await restore(b);
                  alert("Backup wiederhergestellt.");
                }
              } catch (err) {
                error(err);
              } finally {
                e.target.value = "";
              }
            }}
          />
        </label>
        <p>
          Deine Daten bleiben auf diesem Gerät. Gelöschte Browserdaten können
          nicht wiederhergestellt werden. Exportiere regelmäßig ein Backup.
        </p>
        <button
          onClick={async () => {
            if (
              confirm(
                "Alle Trainingsdaten, Übungen und Einstellungen unwiderruflich löschen?",
              )
            ) {
              await db.transaction(
                "rw",
                db.workouts,
                db.exercises,
                db.settings,
                async () => {
                  await db.workouts.clear();
                  await db.exercises.clear();
                  await db.settings.clear();
                },
              );
              await init();
            }
          }}
        >
          Alle Daten löschen
        </button>
      </article>
      <p>
        SET · Version 1.0.0
        <br />
        Auf dem iPhone: Safari → Teilen → Zum Home-Bildschirm.
      </p>
    </>
  );
}
function Import() {
  const [files, F] = useState<File[]>([]),
    [w, W] = useState<Workout | null>(null),
    [status, S] = useState(""),
    [warnings, A] = useState<string[]>([]),
    [busy, B] = useState(false);
  const nav = useNavigate();
  return (
    <>
      <h1>Screenshot importieren</h1>
      <p>1. Auswählen · 2. Erkennen · 3. Prüfen · 4. Speichern</p>
      <article>
        <p>
          Lokale Erkennung auf deinem Gerät. Beim ersten Start werden
          OCR-Sprachdateien geladen. Keine Bildübertragung.
        </p>
        <input
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp"
          disabled={busy}
          onChange={(e) => {
            const fs = Array.from(e.target.files ?? []);
            if (
              fs.some(
                (f) =>
                  !["image/png", "image/jpeg", "image/webp"].includes(f.type) ||
                  f.size > 15 * 1024 * 1024,
              ) ||
              files.length + fs.length > 8
            ) {
              S(
                "Maximal 8 PNG/JPEG/WebP-Dateien mit je 15 MB. HEIC bitte als JPEG exportieren.",
              );
              return;
            }
            F([...files, ...fs]);
          }}
        />
        {files.map((f, i) => (
          <div key={i}>
            {f.name}
            <button
              disabled={busy || i === 0}
              onClick={() => {
                const a = [...files];
                [a[i - 1], a[i]] = [a[i], a[i - 1]];
                F(a);
              }}
            >
              ↑
            </button>
            <button
              disabled={busy}
              onClick={() => F(files.filter((_, j) => j !== i))}
            >
              Entfernen
            </button>
          </div>
        ))}
        <button
          className="primary"
          disabled={!files.length || busy}
          onClick={async () => {
            B(true);
            try {
              const r = await recognize(files, S);
              W(r.workout);
              A(r.warnings);
              S("Erkennung beendet. Bitte alle Werte prüfen.");
            } catch (e) {
              S(String(e));
            } finally {
              B(false);
            }
          }}
        >
          Lokal erkennen
        </button>
        <button
          onClick={() =>
            S(
              "KI-Erkennung ist nicht konfiguriert. Die lokale Erkennung und manuelle Korrektur sind verfügbar.",
            )
          }
        >
          Mit KI genauer erkennen
        </button>
        <p role="status">{status}</p>
      </article>
      {w && (
        <>
          <article>
            {warnings.map((x, i) => (
              <p key={i}>ⓘ {x}</p>
            ))}
          </article>
          <WorkoutFields w={w} save={W} />
          <button
            className="primary action"
            disabled={
              busy ||
              !w.date ||
              !w.name.trim() ||
              w.exercises.some((e) => !e.name.trim())
            }
            onClick={async () => {
              B(true);
              try {
                await db.transaction("rw", db.workouts, async () => {
                  await db.workouts.add(w);
                });
                F([]);
                W(null);
                alert("Workout gespeichert.");
                nav("/history");
              } catch (e) {
                error(e);
                B(false);
              }
            }}
          >
            Workout speichern
          </button>
        </>
      )}
      <button
        disabled={busy}
        onClick={() => {
          F([]);
          W(null);
          nav("/training");
        }}
      >
        Import abbrechen
      </button>
    </>
  );
}
init()
  .then(() =>
    createRoot(document.getElementById("root")!).render(
      <React.StrictMode>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </React.StrictMode>,
    ),
  )
  .catch(error);
