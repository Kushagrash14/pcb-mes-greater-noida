const formatScanTime = (dateValue) => {
  if (!dateValue) return "";

  // MySQL datetime:
  // "2026-08-24 15:06:33"
  const date = new Date(
    typeof dateValue === "string"
      ? dateValue.replace(" ", "T")
      : dateValue
  );

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const now = new Date();

  const diffMs = now - date;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  // ----------------------------------------------------------
  // Just now
  // ----------------------------------------------------------

  if (diffMinutes < 1) {
    return "Just now";
  }

  // ----------------------------------------------------------
  // Minutes
  // ----------------------------------------------------------

  if (diffMinutes < 60) {
    return `${diffMinutes} min ago`;
  }

  // ----------------------------------------------------------
  // Hours
  // ----------------------------------------------------------

  if (diffHours < 8) {
    return `${diffHours} ${diffHours === 1 ? "hr" : "hrs"} ago`;
  }

  // ----------------------------------------------------------
  // Same day
  // ----------------------------------------------------------

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const time = date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  if (isToday) {
    return `Today, ${time}`;
  }

  // ----------------------------------------------------------
  // Yesterday
  // ----------------------------------------------------------

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) {
    return `Yesterday, ${time}`;
  }

  // ----------------------------------------------------------
  // Within last 7 days
  // ----------------------------------------------------------

  if (diffHours < 24 * 7) {
    const dayName = date.toLocaleDateString([], {
      weekday: "long",
    });

    return `${dayName}, ${time}`;
  }

  // ----------------------------------------------------------
  // Same year
  // ----------------------------------------------------------

  if (date.getFullYear() === now.getFullYear()) {
    const formattedDate = date.toLocaleDateString([], {
      day: "numeric",
      month: "short",
    });

    return `${formattedDate}, ${time}`;
  }

  // ----------------------------------------------------------
  // Older
  // ----------------------------------------------------------

  return date.toLocaleDateString([], {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export default formatScanTime;