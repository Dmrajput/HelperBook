export const ATTENDANCE_STATUSES = [
  { value: "present", label: "Present" },
  { value: "absent", label: "Absent" },
  { value: "half_day", label: "Half Day" },
  { value: "leave", label: "Leave" },
];

export const STATUS_LABELS = Object.fromEntries(ATTENDANCE_STATUSES.map((status) => [status.value, status.label]));
