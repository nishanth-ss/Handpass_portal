import { useEffect, useMemo, useState } from "react";
import { addMonths, format, startOfMonth } from "date-fns";
import { CheckCircle2, XCircle } from "lucide-react";
import {
  HeaderBar,
  CalendarGrid,
  ShiftSettingsPanel,
  Drawer,
  DayDetailsDrawerContent,
  StatCard,
  ProgressBar,
  ALL_USERS,
  toMinutes,
  minutesToHHMM,
  generateCalendarDays,
  calculateDayAggregates,
  calculateMonthStats,
  computeStatus,
  getHolidayForDate,
  type User,
  type InPunch,
  type Holiday,
} from "../components/attendance";

// Mock Data (replace with API later)
const MOCK_USERS: User[] = [
  { id: "u1", name: "Amit" },
  { id: "u2", name: "Neha" },
  { id: "u3", name: "Rahul" },
];

const MOCK_IN_PUNCHES: InPunch[] = [
  // Amit
  { userId: "u1", date: "2026-02-02", inTime: "09:05" },
  { userId: "u1", date: "2026-02-03", inTime: "09:22" },
  { userId: "u1", date: "2026-02-05", inTime: "08:58" },
  { userId: "u1", date: "2026-02-06", inTime: "10:10" },
  // Neha
  { userId: "u2", date: "2026-02-02", inTime: "09:02" },
  { userId: "u2", date: "2026-02-04", inTime: "09:40" },
  // Rahul
  { userId: "u3", date: "2026-02-03", inTime: "08:50" },
  { userId: "u3", date: "2026-02-06", inTime: "09:10" },
];

const MOCK_HOLIDAYS: Holiday[] = [{ date: "2026-02-14", name: "Sample Holiday" }];

export default function AttendanceModule() {
  // Demo "now": fixed
  const today = useMemo(() => new Date(2026, 1, 8, 10, 30), []);
  const [currentMonth, setCurrentMonth] = useState<Date>(startOfMonth(today));

  // User selection
  const [selectedUserId, setSelectedUserId] = useState<string>(ALL_USERS);

  // Shift config
  const [shiftName, setShiftName] = useState<string>("General");
  const [shiftStart, setShiftStart] = useState<string>("09:00");
  const [shiftEnd, setShiftEnd] = useState<string>("19:00");
  const [graceMinutes, setGraceMinutes] = useState<number>(15);
  const [weekOffDays, setWeekOffDays] = useState<number[]>([0]); // Sunday

  // Drawer state
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Processed data
  const holidaysByDate = useMemo(() => {
    const m = new Map<string, Holiday>();
    for (const h of MOCK_HOLIDAYS) m.set(h.date, h);
    return m;
  }, []);

  const days = useMemo(() => generateCalendarDays(currentMonth), [currentMonth]);

  const lateAfterMinutes = toMinutes(shiftStart) + graceMinutes;
  const lateAfter = minutesToHHMM(lateAfterMinutes);

  // Single-user punches map
  const punchesByDate = useMemo(() => {
    const m = new Map<string, InPunch>();
    if (selectedUserId === ALL_USERS) return m;

    for (const p of MOCK_IN_PUNCHES) {
      if (p.userId === selectedUserId) m.set(p.date, p);
    }
    return m;
  }, [selectedUserId]);

  // Pre-index punches for ALL mode
  const punchIndexByDate = useMemo(() => {
    const byDate = new Map<string, Map<string, InPunch>>();
    for (const p of MOCK_IN_PUNCHES) {
      if (!byDate.has(p.date)) byDate.set(p.date, new Map());
      byDate.get(p.date)!.set(p.userId, p);
    }
    return byDate;
  }, []);

  // ALL users aggregates for each day
  const dayAggByDate = useMemo(() => {
    return calculateDayAggregates({
      days,
      users: MOCK_USERS,
      holidaysByDate,
      weekOffDays,
      today,
      shiftStart,
      graceMinutes,
      punchIndexByDate,
    });
  }, [
    days,
    holidaysByDate,
    weekOffDays,
    today,
    shiftStart,
    graceMinutes,
    punchIndexByDate,
  ]);

  // Month stats
  const monthStats = useMemo(() => {
    return calculateMonthStats({
      monthStart: startOfMonth(currentMonth),
      monthEnd: new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0),
      holidaysByDate,
      weekOffDays,
      today,
      selectedUserId,
      dayAggByDate,
      punchesByDate,
      shiftStart,
      graceMinutes,
      users: MOCK_USERS,
    });
  }, [
    currentMonth,
    holidaysByDate,
    weekOffDays,
    today,
    selectedUserId,
    dayAggByDate,
    punchesByDate,
    shiftStart,
    graceMinutes,
    MOCK_USERS,
  ]);

  // Drawer selections
  const selectedKey = selectedDate ? format(selectedDate, "yyyy-MM-dd") : null;
  const selectedHoliday = selectedKey ? getHolidayForDate(holidaysByDate, selectedKey) : null;
  const selectedPunch = selectedKey && selectedUserId !== ALL_USERS ? punchesByDate.get(selectedKey) ?? null : null;
  const selectedComputed = selectedDate && selectedUserId !== ALL_USERS
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
  const selectedAgg = selectedKey ? dayAggByDate.get(selectedKey) ?? null : null;

  const drawerTitle = selectedDate
    ? `Day Details • ${format(selectedDate, "yyyy-MM-dd")} • ${selectedUserId === ALL_USERS
      ? "All Users"
      : MOCK_USERS.find((u) => u.id === selectedUserId)?.name ?? "User"
    }`
    : "Day Details";

  const todayLabel = format(today, "yyyy-MM-dd HH:mm");

  useEffect(() => {
    const API_KEY = '9ynOV3nhJHsWWcWCcGjfkJLbVl33wicr'; 
    // Fixed URL structure below:
    const url = `https://calendarific.com/api/v2/holidays?api_key=${API_KEY}&country=IN&year=2026`;

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        // Calendarific nests the array inside response.holidays
        console.log("India Holiday Data:", data.response.holidays);
      })
      .catch((err) => console.error("Fetch Error:", err));
  }, []);



  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
      <div className="mx-auto py-6 px-4">

        {/* Stats Cards */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <StatCard
              title="Present (incl. Late)"
              value={monthStats.present}
              subtitle={`For ${format(currentMonth, "MMMM yyyy")}`}
              icon={<div className="h-5 w-5 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                <CheckCircle2 className="h-3 w-3 text-white" />
              </div>}
              accent="from-emerald-500 to-teal-600"
            />
            <ProgressBar
              value={monthStats.present}
              total={Math.max(1, monthStats.workingDays)}
              color="emerald"
            />
          </div>

          <div>
            <StatCard
              title="Absent"
              value={monthStats.absent}
              subtitle={
                selectedUserId === ALL_USERS
                  ? `Working days: ${monthStats.workingDays} • Users: ${MOCK_USERS.length}`
                  : `Working days counted: ${monthStats.workingDays}`
              }
              icon={<div className="h-5 w-5 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center">
                <XCircle className="h-3 w-3 text-white" />
              </div>}
              accent="from-rose-500 to-pink-600"
            />
            <ProgressBar
              value={monthStats.absent}
              total={Math.max(1, monthStats.workingDays)}
              color="rose"
            />
          </div>
        </div>

        {/* Header */}
        <HeaderBar
          selectedUserId={selectedUserId}
          onChangeUser={setSelectedUserId}
          users={MOCK_USERS}
          shiftName={shiftName}
          shiftStart={shiftStart}
          shiftEnd={shiftEnd}
          graceMinutes={graceMinutes}
          lateAfter={lateAfter}
          currentMonth={currentMonth}
          onPrev={() => setCurrentMonth(addMonths(currentMonth, -1))}
          onToday={() => setCurrentMonth(startOfMonth(today))}
          onNext={() => setCurrentMonth(addMonths(currentMonth, 1))}
          todayLabel={todayLabel}
        />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_0.6fr] gap-6 items-start">
          {/* Calendar */}
          <CalendarGrid
            days={days}
            currentMonth={currentMonth}
            today={today}
            lateAfter={lateAfter}
            shiftStart={shiftStart}
            graceMinutes={graceMinutes}
            weekOffDays={weekOffDays}
            holidaysByDate={holidaysByDate}
            selectedUserId={selectedUserId}
            punchesByDate={punchesByDate}
            dayAggByDate={dayAggByDate}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />

          {/* Settings Panel */}
          <ShiftSettingsPanel
            shiftName={shiftName}
            setShiftName={setShiftName}
            shiftStart={shiftStart}
            setShiftStart={setShiftStart}
            shiftEnd={shiftEnd}
            setShiftEnd={setShiftEnd}
            graceMinutes={graceMinutes}
            setGraceMinutes={setGraceMinutes}
            weekOffDays={weekOffDays}
            setWeekOffDays={setWeekOffDays}
            lateAfter={lateAfter}
          />
        </div>

        {/* Drawer */}
        <Drawer open={!!selectedDate} onClose={() => setSelectedDate(null)} title={drawerTitle}>
          {selectedDate ? (
            <DayDetailsDrawerContent
              selectedUserId={selectedUserId}
              punch={selectedPunch}
              computed={selectedComputed}
              holiday={selectedHoliday}
              agg={selectedAgg}
              shiftName={shiftName}
              shiftStart={shiftStart}
              shiftEnd={shiftEnd}
              graceMinutes={graceMinutes}
              lateAfter={lateAfter}
            />
          ) : null}
        </Drawer>
      </div>
    </div>
  );
}
