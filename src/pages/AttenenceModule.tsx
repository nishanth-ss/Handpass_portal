import React, { useMemo, useState } from "react";
import {
  addMonths,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  addDays,
  endOfWeek,
  endOfMonth,
  isAfter,
} from "date-fns";

// -----------------------------
// Types
// -----------------------------
type InPunch = {
  date: string; // yyyy-MM-dd
  inTime: string; // HH:mm
};

type Holiday = {
  date: string; // yyyy-MM-dd
  name: string;
};

type Status = "PRESENT" | "LATE" | "ABSENT" | "HOLIDAY" | "WEEK_OFF" | "UPCOMING";

type ComputedStatus = {
  status: Status;
  label: string;
};

// -----------------------------
// Mock data (replace with API later)
// -----------------------------
const MOCK_IN_PUNCHES: InPunch[] = [
  { date: "2026-02-02", inTime: "09:05" },
  { date: "2026-02-03", inTime: "09:22" },
  { date: "2026-02-05", inTime: "08:58" },
  { date: "2026-02-06", inTime: "10:10" },
];

const MOCK_HOLIDAYS: Holiday[] = [{ date: "2026-02-14", name: "Sample Holiday" }];

// -----------------------------
// Helpers
// -----------------------------
function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function minutesToHHMM(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function isWeekOff(date: Date, weekOffDays: number[]): boolean {
  // date-fns: Sunday=0 ... Saturday=6
  return weekOffDays.includes(date.getDay());
}

function getPunchForDate(
  punchesByDate: Map<string, InPunch>,
  yyyyMmDd: string
): InPunch | null {
  return punchesByDate.get(yyyyMmDd) ?? null;
}

function getHolidayForDate(
  holidaysByDate: Map<string, Holiday>,
  yyyyMmDd: string
): Holiday | null {
  return holidaysByDate.get(yyyyMmDd) ?? null;
}

// Status rules for ONLY-IN attendance
function computeStatus(args: {
  date: Date;
  today: Date;
  shiftStart: string;
  graceMinutes: number;
  weekOffDays: number[];
  punch: InPunch | null;
  holiday: Holiday | null;
}): ComputedStatus {
  const { date, today, shiftStart, graceMinutes, weekOffDays, punch, holiday } = args;

  if (holiday) return { status: "HOLIDAY", label: holiday.name };
  if (isWeekOff(date, weekOffDays)) return { status: "WEEK_OFF", label: "Week Off" };

  // Future dates: show blank / scheduled
  if (isAfter(date, today)) return { status: "UPCOMING", label: "" };

  // If no punch and date is today or past -> absent
  if (!punch) return { status: "ABSENT", label: "No IN" };

  // Late check: compare inTime to shiftStart+grace
  const lateAfter = toMinutes(shiftStart) + Number(graceMinutes || 0);
  const inMin = toMinutes(punch.inTime);

  if (inMin > lateAfter) {
    return { status: "LATE", label: `Late by ${inMin - lateAfter} min` };
  }

  return { status: "PRESENT", label: "On time" };
}

// Missed login highlight: only meaningful for TODAY after deadline
function isMissedLoginToday(args: {
  date: Date;
  today: Date;
  shiftStart: string;
  graceMinutes: number;
  punch: InPunch | null;
}): boolean {
  const { date, today, shiftStart, graceMinutes, punch } = args;

  if (!isSameDay(date, today)) return false;

  // For demo: treat `today` as "now". In real UI: use new Date() instead.
  const now = today;
  const deadlineMinutes = toMinutes(shiftStart) + Number(graceMinutes || 0);

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return nowMinutes > deadlineMinutes && !punch;
}

// -----------------------------
// UI Components
// -----------------------------
function StatusPill({ status }: { status: Status }) {
  const base =
    "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border";

  const map: Record<Status, string> = {
    PRESENT: "border-green-200 bg-green-50 text-green-700",
    LATE: "border-amber-200 bg-amber-50 text-amber-800",
    ABSENT: "border-red-200 bg-red-50 text-red-700",
    HOLIDAY: "border-blue-200 bg-blue-50 text-blue-700",
    WEEK_OFF: "border-slate-200 bg-slate-50 text-slate-700",
    UPCOMING: "border-zinc-200 bg-zinc-50 text-zinc-600",
  };

  return <span className={`${base} ${map[status]}`}>{status}</span>;
}

function Drawer({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
        <div className="flex items-center justify-between border-b p-4">
          <div className="font-semibold">{title}</div>
          <button
            onClick={onClose}
            className="rounded-md border px-2 py-1 text-sm hover:bg-zinc-50"
          >
            Close
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

function TimeField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-zinc-700">{label}</span>
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border px-3 py-2"
      />
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min = 0,
  max = 600,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-zinc-700">{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(Number(e.target.value))}
        className="rounded-md border px-3 py-2"
      />
    </label>
  );
}

function WeekOffPicker({
  value,
  onChange,
}: {
  value: number[];
  onChange: (v: number[]) => void;
}) {
  const days: { k: number; name: string }[] = [
    { k: 0, name: "Sun" },
    { k: 1, name: "Mon" },
    { k: 2, name: "Tue" },
    { k: 3, name: "Wed" },
    { k: 4, name: "Thu" },
    { k: 5, name: "Fri" },
    { k: 6, name: "Sat" },
  ];

  return (
    <div className="text-sm">
      <div className="mb-2 text-zinc-700">Week Off Days</div>
      <div className="flex flex-wrap gap-2">
        {days.map((d) => {
          const selected = value.includes(d.k);
          return (
            <button
              key={d.k}
              type="button"
              onClick={() => {
                if (selected) onChange(value.filter((x) => x !== d.k));
                else onChange([...value, d.k].sort((a, b) => a - b));
              }}
              className={[
                "rounded-full border px-3 py-1 text-xs",
                selected
                  ? "bg-zinc-900 text-white border-zinc-900"
                  : "hover:bg-zinc-50",
              ].join(" ")}
            >
              {d.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// -----------------------------
// Main Page
// -----------------------------
export default function AttendanceCalendarPage() {
  // Demo “now”: fixed to 2026-02-08 10:30 (Asia/Kolkata context)
  // In real app: const today = new Date()
  const today = useMemo(() => new Date(2026, 1, 8, 10, 30), []);
  const [currentMonth, setCurrentMonth] = useState<Date>(startOfMonth(today));

  // Shift config (UI-editable)
  const [shiftName, setShiftName] = useState<string>("General");
  const [shiftStart, setShiftStart] = useState<string>("09:00");
  const [shiftEnd, setShiftEnd] = useState<string>("19:00");
  const [graceMinutes, setGraceMinutes] = useState<number>(15);
  const [weekOffDays, setWeekOffDays] = useState<number[]>([0]); // Sunday

  // Drawer state
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const punchesByDate = useMemo(() => {
    const m = new Map<string, InPunch>();
    for (const p of MOCK_IN_PUNCHES) m.set(p.date, p);
    return m;
  }, []);

  const holidaysByDate = useMemo(() => {
    const m = new Map<string, Holiday>();
    for (const h of MOCK_HOLIDAYS) m.set(h.date, h);
    return m;
  }, []);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const lateAfterMinutes = toMinutes(shiftStart) + graceMinutes;
  const lateAfter = minutesToHHMM(lateAfterMinutes);

  const days: Date[] = [];
  let d = gridStart;
  while (d <= gridEnd) {
    days.push(d);
    d = addDays(d, 1);
  }

  const selectedKey = selectedDate ? format(selectedDate, "yyyy-MM-dd") : null;
  const selectedPunch = selectedKey
    ? getPunchForDate(punchesByDate, selectedKey)
    : null;
  const selectedHoliday = selectedKey
    ? getHolidayForDate(holidaysByDate, selectedKey)
    : null;

  const selectedComputed = selectedDate
    ? computeStatus({
        date: selectedDate,
        today,
        shiftStart,
        graceMinutes,
        weekOffDays,
        punch: selectedPunch,
        holiday: selectedHoliday,
      })
    : null;

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-full">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-2xl font-semibold">Attendance Calendar</div>
            <div className="text-sm text-zinc-600">
              Shift: <span className="font-medium">{shiftName}</span> •{" "}
              {shiftStart}–{shiftEnd} • Grace {graceMinutes} min • Late after{" "}
              <span className="font-medium">{lateAfter}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              className="rounded-md border bg-white px-3 py-2 text-sm hover:bg-zinc-50"
              onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}
            >
              Prev
            </button>
            <button
              className="rounded-md border bg-white px-3 py-2 text-sm hover:bg-zinc-50"
              onClick={() => setCurrentMonth(startOfMonth(today))}
            >
              Today
            </button>
            <button
              className="rounded-md border bg-white px-3 py-2 text-sm hover:bg-zinc-50"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              Next
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          {/* Calendar */}
          <div className="rounded-xl border bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-lg font-semibold">
                {format(currentMonth, "MMMM yyyy")}
              </div>
              <div className="text-xs text-zinc-500">
                Demo “now”: {format(today, "yyyy-MM-dd HH:mm")}
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 text-xs text-zinc-500">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((x) => (
                <div key={x} className="px-1 py-2 text-center font-medium">
                  {x}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {days.map((dateObj) => {
                const key = format(dateObj, "yyyy-MM-dd");
                const punch = getPunchForDate(punchesByDate, key);
                const holiday = getHolidayForDate(holidaysByDate, key);

                const computed = computeStatus({
                  date: dateObj,
                  today,
                  shiftStart,
                  graceMinutes,
                  weekOffDays,
                  punch,
                  holiday,
                });

                const inMonth = isSameMonth(dateObj, currentMonth);
                const isSelected = selectedDate && isSameDay(dateObj, selectedDate);

                const missed = isMissedLoginToday({
                  date: dateObj,
                  today,
                  shiftStart,
                  graceMinutes,
                  punch,
                });

                return (
                  <button
                    key={key}
                    onClick={() => setSelectedDate(dateObj)}
                    className={[
                      "min-h-[92px] rounded-lg border p-2 text-left hover:bg-zinc-50",
                      inMonth ? "bg-white" : "bg-zinc-50 text-zinc-400",
                      isSelected ? "ring-2 ring-zinc-900" : "",
                      missed ? "border-red-300" : "",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between">
                      <div className="text-sm font-semibold">
                        {format(dateObj, "d")}
                      </div>
                      <StatusPill status={computed.status} />
                    </div>

                    <div className="mt-2 space-y-1">
                      {holiday ? (
                        <div className="text-xs font-medium text-blue-700 line-clamp-2">
                          {holiday.name}
                        </div>
                      ) : null}

                      {punch ? (
                        <div className="text-xs text-zinc-700">
                          <span className="font-medium">IN</span> {punch.inTime}
                        </div>
                      ) : (
                        <div className="text-xs text-zinc-500">
                          {computed.status === "UPCOMING" ? "" : "No IN"}
                        </div>
                      )}

                      {computed.status === "LATE" ? (
                        <div className="text-[11px] text-amber-800">
                          {computed.label}
                        </div>
                      ) : null}

                      {missed ? (
                        <div className="text-[11px] font-medium text-red-700">
                          Missed login (after {lateAfter})
                        </div>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Shift Settings Panel */}
          <div className="rounded-xl border bg-white p-4">
            <div className="mb-3 text-lg font-semibold">
              Shift & Timing Settings (UI)
            </div>

            <div className="grid grid-cols-1 gap-3">
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-zinc-700">Shift Name</span>
                <input
                  value={shiftName}
                  onChange={(e) => setShiftName(e.target.value)}
                  className="rounded-md border px-3 py-2"
                  placeholder="General"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <TimeField
                  label="Start Time"
                  value={shiftStart}
                  onChange={setShiftStart}
                />
                <TimeField
                  label="End Time"
                  value={shiftEnd}
                  onChange={setShiftEnd}
                />
              </div>

              <NumberField
                label="Grace Minutes"
                value={graceMinutes}
                onChange={setGraceMinutes}
                min={0}
                max={120}
              />

              <WeekOffPicker value={weekOffDays} onChange={setWeekOffDays} />

              <div className="rounded-lg border bg-zinc-50 p-3 text-sm">
                <div className="font-medium">Computed Rules Preview</div>
                <div className="mt-1 text-zinc-700">
                  Late after: <span className="font-semibold">{lateAfter}</span>
                </div>
                <div className="text-zinc-700">
                  If no IN on working day (past date) →{" "}
                  <span className="font-semibold">ABSENT</span>
                </div>
                <div className="text-zinc-700">Holiday/Week-off → not absent</div>
              </div>

              <div className="text-xs text-zinc-500">
                Later you can save these settings to DB. For now, this UI updates
                rules instantly.
              </div>
            </div>
          </div>
        </div>

        {/* Day drawer */}
        <Drawer
          open={!!selectedDate}
          onClose={() => setSelectedDate(null)}
          title={
            selectedDate
              ? `Day Details • ${format(selectedDate, "yyyy-MM-dd")}`
              : "Day Details"
          }
        >
          {selectedDate && (
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <div className="font-medium">Status</div>
                <StatusPill status={selectedComputed?.status || "UPCOMING"} />
              </div>

              <div className="rounded-lg border p-3">
                <div className="font-medium">Shift</div>
                <div className="mt-1 text-zinc-700">
                  {shiftName}: {shiftStart}–{shiftEnd}
                </div>
                <div className="text-zinc-700">
                  Grace: {graceMinutes} min • Late after: {lateAfter}
                </div>
              </div>

              {selectedHoliday && (
                <div className="rounded-lg border p-3">
                  <div className="font-medium text-blue-700">Holiday</div>
                  <div className="mt-1">{selectedHoliday.name}</div>
                </div>
              )}

              <div className="rounded-lg border p-3">
                <div className="font-medium">Punches (only IN)</div>
                {selectedPunch ? (
                  <div className="mt-2 flex items-center justify-between">
                    <div>IN</div>
                    <div className="font-semibold">{selectedPunch.inTime}</div>
                  </div>
                ) : (
                  <div className="mt-2 text-zinc-600">No IN punch</div>
                )}
              </div>

              {selectedComputed?.label ? (
                <div className="rounded-lg border bg-zinc-50 p-3">
                  <div className="font-medium">Note</div>
                  <div className="mt-1 text-zinc-700">{selectedComputed.label}</div>
                </div>
              ) : null}

              <div className="text-xs text-zinc-500">
                Add actions later: Regularize / Mark leave / Admin override.
              </div>
            </div>
          )}
        </Drawer>
      </div>
    </div>
  );
}
