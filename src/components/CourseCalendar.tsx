import { useMemo, useState, type FormEvent } from "react";
import { MILESTONES } from "../data/milestones";
import "./CourseCalendar.css";

type PersonalItemType = "reminder" | "todo";

interface PersonalItem {
  id: string;
  title: string;
  date: string;
  type: PersonalItemType;
  completed: boolean;
}

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  kind: "submission" | "review";
}

const STORAGE_KEY = "ludwitt-calendar-items";

function loadItems(): PersonalItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PersonalItem[]) : [];
  } catch {
    return [];
  }
}

function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function makeId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `calendar-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

const TIME_FORMAT = new Intl.DateTimeFormat("en-GB", {
  hour: "numeric",
  minute: "2-digit",
});

export default function CourseCalendar() {
  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);
  const days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => {
        const date = new Date(today);
        date.setDate(today.getDate() + index);
        return date;
      }),
    [today]
  );
  const courseEvents = useMemo<CalendarEvent[]>(
    () =>
      MILESTONES.flatMap((milestone) => [
        {
          id: `${milestone.week}-submission`,
          title: `${milestone.week} submission`,
          date: new Date(milestone.submissionDeadline),
          kind: "submission" as const,
        },
        {
          id: `${milestone.week}-review`,
          title: `${milestone.week} review & vote`,
          date: new Date(milestone.reviewDeadline),
          kind: "review" as const,
        },
      ]),
    []
  );

  const [items, setItems] = useState<PersonalItem[]>(loadItems);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(dateKey(today));
  const [type, setType] = useState<PersonalItemType>("todo");

  function save(next: PersonalItem[]) {
    setItems(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  function addItem(event: FormEvent) {
    event.preventDefault();
    if (!title.trim() || !date) return;
    save([
      ...items,
      {
        id: makeId(),
        title: title.trim(),
        date,
        type,
        completed: false,
      },
    ]);
    setTitle("");
  }

  function toggleItem(id: string) {
    save(
      items.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  }

  function removeItem(id: string) {
    save(items.filter((item) => item.id !== id));
  }

  const sortedItems = [...items].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <section className="course-calendar" aria-labelledby="calendar-title">
      <div className="container">
        <div className="course-calendar__head">
          <div>
            <span className="eyebrow">Next seven days</span>
            <h2 id="calendar-title" className="section-title">
              Deadlines &amp; personal planner
            </h2>
            <p className="section-lead">
              Course deadlines are highlighted automatically. Add your own
              reminders and to-do tasks to stay ahead.
            </p>
          </div>
        </div>

        <div className="calendar-strip">
          {days.map((day, index) => {
            const key = dateKey(day);
            const deadlines = courseEvents.filter(
              (event) => dateKey(event.date) === key
            );
            const personal = items.filter((item) => item.date === key);
            const hasEvents = deadlines.length > 0 || personal.length > 0;

            return (
              <article
                key={key}
                className={`calendar-day ${
                  index === 0 ? "calendar-day--today" : ""
                } ${hasEvents ? "calendar-day--active" : ""}`}
              >
                <div className="calendar-day__date">
                  <span>
                    {day.toLocaleDateString("en-GB", { weekday: "short" })}
                  </span>
                  <strong>{day.getDate()}</strong>
                  <span>
                    {day.toLocaleDateString("en-GB", { month: "short" })}
                  </span>
                </div>

                <div className="calendar-day__events">
                  {deadlines.map((deadline) => (
                    <div
                      key={deadline.id}
                      className={`calendar-event calendar-event--${deadline.kind}`}
                    >
                      <span>{deadline.title}</span>
                      <strong>{TIME_FORMAT.format(deadline.date)}</strong>
                    </div>
                  ))}
                  {personal.map((item) => (
                    <div
                      key={item.id}
                      className={`calendar-event calendar-event--personal ${
                        item.completed ? "is-complete" : ""
                      }`}
                    >
                      <span>{item.title}</span>
                      <strong>{item.type}</strong>
                    </div>
                  ))}
                  {!hasEvents && (
                    <span className="calendar-day__empty">No events</span>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        <div className="planner">
          <form className="planner__form" onSubmit={addItem}>
            <h3>Add a reminder or to-do</h3>
            <div className="planner__fields">
              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. Polish project demo"
                aria-label="Reminder or task"
                required
              />
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                aria-label="Date"
                required
              />
              <select
                value={type}
                onChange={(event) =>
                  setType(event.target.value as PersonalItemType)
                }
                aria-label="Item type"
              >
                <option value="todo">To-do</option>
                <option value="reminder">Reminder</option>
              </select>
              <button type="submit" className="btn btn-primary">
                Add
              </button>
            </div>
          </form>

          <div className="planner__list" aria-label="Personal planner items">
            <h3>Your planner</h3>
            {sortedItems.length === 0 ? (
              <p className="planner__empty">
                No personal reminders or to-dos yet.
              </p>
            ) : (
              sortedItems.map((item) => (
                <div
                  key={item.id}
                  className={`planner-item ${
                    item.completed ? "planner-item--done" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={() => toggleItem(item.id)}
                    aria-label={`Mark ${item.title} complete`}
                  />
                  <div>
                    <strong>{item.title}</strong>
                    <span>
                      {new Date(`${item.date}T12:00:00`).toLocaleDateString(
                        "en-GB",
                        {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                        }
                      )}{" "}
                      · {item.type}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    aria-label={`Delete ${item.title}`}
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
