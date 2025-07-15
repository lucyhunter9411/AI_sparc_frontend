export function parseVersionAndDate(versionStr?: string): {
  version: string;
  date: string;
} {
  if (!versionStr) return { version: "", date: "" };
  const match = versionStr.match(/^v?(\d+\.\d+\.\d+)\.(\d{8})\.(\d+)$/);
  if (match) {
    const version = `v${match[1]}.${match[3]}`;
    const dateRaw = match[2];
    const year = dateRaw.slice(0, 4);
    const month = dateRaw.slice(4, 6);
    const day = dateRaw.slice(6, 8);
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const monthName = monthNames[parseInt(month, 10) - 1] || month;
    const date = `${monthName} ${day} ${year}`;
    return { version, date };
  }
  return { version: versionStr, date: "" };
}
