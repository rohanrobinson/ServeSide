const HOURS = [8, 10, 12, 14, 16, 18, 20];

function toIso(dateIso: string, hour24: number): string {
  const base = new Date(`${dateIso}T00:00:00`);
  base.setHours(hour24, 0, 0, 0);
  return base.toISOString();
}

function formatHour(hour24: number): string {
  const period = hour24 >= 12 ? "PM" : "AM";
  const normalized = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${normalized}:00 ${period}`;
}

export function buildDefaultTimeBlocks(dateIso: string) {
  return HOURS.map((hour, index) => {
    const startIso = toIso(dateIso, hour);
    const endIso = toIso(dateIso, hour + 1);

    return {
      id: `slot-${index + 1}`,
      startIso,
      endIso,
      label: `${formatHour(hour)} - ${formatHour(hour + 1)}`,
    };
  });
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
