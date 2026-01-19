export type Attendance = {
  id: number;
  work_start_time: string;   // "HH:MM:SS"
  work_end_time: string;     // "HH:MM:SS"
  weekly_holidays: number[]; // 0-6 (Sun-Sat)
  is_active: boolean;
  updated_at: string;        // ISO timestamp
};

export type AttendanceResponse = {
  data: Attendance;
};
