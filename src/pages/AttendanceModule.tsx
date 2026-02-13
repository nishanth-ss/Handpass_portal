import { useMemo, useState, useEffect } from "react";
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
  calculateMonthStats,
  computeStatus,
  getHolidayForDate,
  type InPunch,
  type Holiday,
} from "../components/attendance";
import { useUserAttendance } from "../service/useSettings";
import { useFetchUserWithGroup } from "../service/useUsers";

export default function AttendanceModule() {
  // Fetch real users from API
  const { data: usersData } = useFetchUserWithGroup({ page: 1, limit: 100 });
  const users = usersData?.data || [];

  // Demo "now": use actual current date
  const today = useMemo(() => new Date(), []);
  const [currentMonth, setCurrentMonth] = useState<Date>(startOfMonth(today));

  // User selection
  const [selectedUserId, setSelectedUserId] = useState<string>("");

  // Set initial user when data loads
  useEffect(() => {
    if (users.length > 0 && !selectedUserId) {
      setSelectedUserId(users[0].id);
    }
  }, [users, selectedUserId]);

  // Shift config
  const [shiftName, setShiftName] = useState<string>("General");
  const [shiftStart, setShiftStart] = useState<string>("09:00");
  const [shiftEnd, setShiftEnd] = useState<string>("19:00");
  const [graceMinutes, setGraceMinutes] = useState<number>(15);
  const [weekOffDays, setWeekOffDays] = useState<number[]>([0]); // Sunday

  // Drawer state
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // API call for attendance data - only when we have a valid user ID
  const attendancePayload = useMemo(() => {
    if (!selectedUserId) return null;
    return {
      user_id: selectedUserId,
      month: currentMonth.getMonth() + 1, // API expects 1-12
      year: currentMonth.getFullYear(),
    };
  }, [selectedUserId, currentMonth]);

  const { data: attendanceData, refetch: refetchAttendance } = useUserAttendance(attendancePayload);

  // Refetch attendance data when user selection changes
  useEffect(() => {
    if (selectedUserId && selectedUserId !== "ALL") {
      refetchAttendance();
    }
  }, [selectedUserId, refetchAttendance]);

  // Process API data into our existing format
  const processedAttendanceData = useMemo(() => {
    if (!attendanceData?.data) {
      return {
        presentCount: 0,
        absentCount: 0,
        workingDays: 0,
        attendanceRate: "0.00",
        calendar: [],
        punchesByDate: new Map<string, InPunch>(),
        holidaysByDate: new Map<string, Holiday>(),
      };
    }

    const { presentCount, absentCount, workingDays, attendanceRate, calendar } = attendanceData.data;    

    // Convert calendar data to punches format
    const punchesByDate = new Map<string, InPunch>();
    calendar?.forEach((day: any) => {
      // Include both present days (with inTime) and absent days
      if (day.inTime || day.status === 'ABSENT') {
        punchesByDate.set(day.date, {
          userId: selectedUserId,
          date: day.date,
          inTime: day.inTime,
        });
      }
    });

    console.log("punchesByDate",punchesByDate);
    

    // Convert to holidays map (empty for now, can be added later)
    const holidaysByDate = new Map<string, Holiday>();
    // MOCK_HOLIDAYS.forEach((holiday) => {
    //   holidaysByDate.set(holiday.date, holiday);
    // });

    return {
      presentCount,
      absentCount,
      workingDays,
      attendanceRate,
      calendar,
      punchesByDate,
      holidaysByDate,
    };
  }, [attendanceData, selectedUserId]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
  // Use actual API data range instead of calculating month boundaries
  const firstApiDate = processedAttendanceData.calendar?.[0]?.date;
  const lastApiDate = processedAttendanceData.calendar?.[processedAttendanceData.calendar?.length - 1]?.date;
  const gridStart = firstApiDate ? new Date(firstApiDate) : new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const gridEnd = lastApiDate ? new Date(lastApiDate) : new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 6);

  const lateAfterMinutes = toMinutes(shiftStart) + graceMinutes;
  const lateAfter = minutesToHHMM(lateAfterMinutes);

  const days: Date[] = useMemo(() => {
    const out: Date[] = [];
    let d = gridStart;
    while (d <= gridEnd) {
      out.push(d);
      d = new Date(d.getTime() + 24 * 60 * 60 * 1000);
    }
    return out;
  }, [gridStart, gridEnd]);

  // Use processed API data
  const punchesByDate = processedAttendanceData.punchesByDate;
  const holidaysByDate = processedAttendanceData.holidaysByDate;

  // ALL users aggregates for each day on grid (for calendar + drawer)
  const dayAggByDate = useMemo(() => {
    const m = new Map<string, any>();

    for (const dateObj of days) {
      const key = format(dateObj, "yyyy-MM-dd");
      const holiday = getHolidayForDate(holidaysByDate, key);
      const weekOff = isWeekOff(dateObj, weekOffDays);
      const upcoming = isAfter(dateObj, today);

      const agg = {
        present: 0,
        absent: 0,
        late: 0,
        holiday,
        weekOff,
        upcoming,
        details: [] as any[],
      };

      // For single user mode, use the API calendar data
      if (selectedUserId !== ALL_USERS) {
        const calendarDay = processedAttendanceData.calendar?.find(
          (day: any) => day.date === key
        );
        
        if (calendarDay && !holiday && !upcoming) {
          // Use backend status, but don't override with weekOff logic
          if (calendarDay.status === "PRESENT") {
            agg.present = 1;
            agg.weekOff = false; // Override calculated weekOff
          } else if (calendarDay.status === "LATE") {
            agg.present = 1;
            agg.late = 1;
            agg.weekOff = false; // Override calculated weekOff
          } else if (calendarDay.status === "ABSENT") {
            agg.absent = 1;
            agg.weekOff = false; // Override calculated weekOff
          } else if (calendarDay.status === "WEEK_OFF") {
            // Keep weekOff flag if backend says it's week off
            agg.weekOff = true;
          }

          agg.details.push({
            userId: selectedUserId,
            userName: attendanceData?.data?.calendar?.find((day: any) => 
              day.date === key && day.status !== "WEEK_OFF" && day.status !== "HOLIDAY"
            )?.inTime ? "Present" : "User",
            status: calendarDay.status,
            inTime: calendarDay.inTime,
            note: calendarDay.status,
          });
        }
      }

      m.set(key, agg);
    }

    return m;
  }, [
    days,
    holidaysByDate,
    weekOffDays,
    today,
    processedAttendanceData.calendar,
    selectedUserId,
    ALL_USERS,
  ]);

  // Use API data for stats
  const monthStats = useMemo(() => {
    if (selectedUserId === ALL_USERS) {
      // For ALL users, we'd need to make multiple API calls or have a different endpoint
      return calculateMonthStats({
        monthStart,
        monthEnd,
        holidaysByDate,
        weekOffDays,
        today,
        selectedUserId,
        dayAggByDate,
        punchesByDate,
        shiftStart,
        graceMinutes,
        users: users,
      });
    } else {
      // Use real API data for single user
      return {
        present: processedAttendanceData.presentCount,
        absent: processedAttendanceData.absentCount,
        workingDays: processedAttendanceData.workingDays,
      };
    }
  }, [
    monthStart,
    monthEnd,
    holidaysByDate,
    weekOffDays,
    today,
    selectedUserId,
    dayAggByDate,
    punchesByDate,
    shiftStart,
    graceMinutes,
    processedAttendanceData,
    [],
  ]);

  // Helper function for week off check
  function isWeekOff(date: Date, weekOffDays: number[]) {
    return weekOffDays.includes(date.getDay());
  }

  // Helper function for date comparison
  function isAfter(date1: Date, date2: Date) {
    return date1 > date2;
  }

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
      : users.find((u: any) => u.id === selectedUserId)?.name ?? "User"
    }`
    : "Day Details";

  const todayLabel = format(today, "yyyy-MM-dd HH:mm");

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
                  ? `Working days: ${monthStats.workingDays} • Users: ${users.length}`
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
