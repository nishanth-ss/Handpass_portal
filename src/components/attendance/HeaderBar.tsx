import { format } from "date-fns";
import { Users, CalendarDays, ChevronLeft, ChevronRight, Home } from "lucide-react";
import type { User, AllUsersType } from "./types";

interface HeaderBarProps {
  selectedUserId: string | AllUsersType;
  onChangeUser: (id: string) => void;
  users: User[];
  shiftName: string;
  shiftStart: string;
  shiftEnd: string;
  graceMinutes: number;
  lateAfter: string;
  currentMonth: Date;
  onPrev: () => void;
  onToday: () => void;
  onNext: () => void;
  todayLabel: string;
}

export function HeaderBar({
  selectedUserId,
  onChangeUser,
  users,
  shiftName,
  shiftStart,
  shiftEnd,
  graceMinutes,
  lateAfter,
  currentMonth,
  onPrev,
  onToday,
  onNext,
  todayLabel,
}: HeaderBarProps) {
  const selectedUserName =
    selectedUserId === "ALL"
      ? "All Users"
      : users.find((u) => u.id === selectedUserId)?.name ?? "User";

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white shadow-2xl">
      <div className="p-6 backdrop-blur-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Left Section - Title and Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-sm border border-white/30">
                <CalendarDays className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white drop-shadow-lg">Attendance Calendar</h1>
                <p className="text-sm text-white/80 mt-0.5">Track and manage employee attendance</p>
              </div>
            </div>
            
            <div className="space-y-2 text-sm text-white/90">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-white/70">User:</span>
                <span className="font-semibold text-white bg-white/20 px-2 py-1 rounded-full backdrop-blur-sm border border-white/30">
                  {selectedUserName}
                </span>
                <span className="text-white/70">•</span>
                <span className="text-white/70">Shift:</span>
                <span className="font-semibold text-black bg-gradient-to-r from-yellow-200 to-orange-200 text-orange-900 px-2 py-1 rounded-full">
                  {shiftName}
                </span>
              </div>
              
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-white/70">Hours:</span>
                <span className="font-mono text-white bg-white/20 px-2 py-1 rounded-full backdrop-blur-sm border border-white/30">
                  {shiftStart}–{shiftEnd}
                </span>
                <span className="text-white/70">•</span>
                <span className="text-white/70">Grace:</span>
                <span className="font-semibold text-black bg-gradient-to-r from-emerald-200 to-teal-200 text-emerald-900 px-2 py-1 rounded-full">
                  {graceMinutes} min
                </span>
                <span className="text-white/70">•</span>
                <span className="text-white/70">Late after:</span>
                <span className="font-semibold text-black bg-gradient-to-r from-amber-300 to-orange-300 text-amber-900 px-2 py-1 rounded-full">
                  {lateAfter}
                </span>
              </div>
              
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-white/70">Month:</span>
                <span className="font-semibold text-white bg-white/20 px-2 py-1 rounded-full backdrop-blur-sm border border-white/30">
                  {format(currentMonth, "MMMM yyyy")}
                </span>
                <span className="text-white/70">•</span>
                <span className="text-white/70">Demo time:</span>
                <span className="font-mono text-xs text-emerald-300 bg-emerald-900/30 px-2 py-1 rounded-full backdrop-blur-sm border border-emerald-400/30">
                  {todayLabel}
                </span>
              </div>
            </div>
          </div>

          {/* Right Section - Controls */}
          <div className="flex flex-col gap-3 lg:items-end">
            {/* User Selector */}
            <div className="flex items-center gap-2 rounded-xl border border-white/30 bg-white/20 px-4 py-2.5 backdrop-blur-sm hover:bg-white/30 transition-colors">
              <Users className="h-4 w-4 text-white/90" />
              <select
                value={selectedUserId}
                onChange={(e) => onChangeUser(e.target.value)}
                className="bg-transparent text-sm font-semibold text-white outline-none cursor-pointer"
              >
                <option value="ALL" className="text-slate-900 bg-white">
                  All Users
                </option>
                {users.map((u) => (
                  <option key={u.id} value={u.id} className="text-slate-900 bg-white">
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Navigation Controls */}
            <div className="flex gap-2">
              <button
                className="group rounded-xl border border-white/30 bg-white/20 px-3 py-2 text-sm font-semibold transition-all hover:bg-white/30 hover:scale-105 active:scale-95 backdrop-blur-sm"
                onClick={onPrev}
                title="Previous Month"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                className="group rounded-xl border border-white/30 bg-white/20 px-4 py-2 text-sm font-semibold transition-all hover:bg-white/30 hover:scale-105 active:scale-95 backdrop-blur-sm"
                onClick={onToday}
                title="Go to Today"
              >
                <Home className="h-4 w-4 mr-1.5 inline" />
                Today
              </button>
              <button
                className="group rounded-xl border border-white/30 bg-white/20 px-3 py-2 text-sm font-semibold transition-all hover:bg-white/30 hover:scale-105 active:scale-95 backdrop-blur-sm"
                onClick={onNext}
                title="Next Month"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
