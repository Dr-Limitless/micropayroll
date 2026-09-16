// MicroFin OS Theme Tokens — accent uses CSS variable so Settings picker applies app-wide
export const ACCENT = "var(--mf-accent, #2E6BE6)";
export const ACCENT_HEX = "#2E6BE6"; // default fallback hex (for places that need a raw color)
export const ACCENT_OPTIONS = ["#2E6BE6", "#0E7C61", "#5B4FE9", "#B45309"];

export const STATUS_COLORS = {
  Active: { bg: "#DCFCE7", fg: "#15803D" },
  Approved: { bg: "#DCFCE7", fg: "#15803D" },
  Completed: { bg: "#DCFCE7", fg: "#15803D" },
  "On Leave": { bg: "#FEF3C7", fg: "#B45309" },
  Pending: { bg: "#FEF3C7", fg: "#B45309" },
  Processing: { bg: "#DBEAFE", fg: "#1D4ED8" },
  Draft: { bg: "#F1F5F9", fg: "#475467" },
  Inactive: { bg: "#F1F5F9", fg: "#64748B" },
  Rejected: { bg: "#FEE2E2", fg: "#DC2626" },
  Overdue: { bg: "#FEE2E2", fg: "#DC2626" },
};

export const badgeStyle = (status) => {
  const c = STATUS_COLORS[status] || STATUS_COLORS.Inactive;
  return {
    fontSize: 11.5,
    fontWeight: 700,
    padding: "4px 10px",
    borderRadius: 20,
    background: c.bg,
    color: c.fg,
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    letterSpacing: "0.02em",
  };
};

export const cardStyle = {
  background: "#fff",
  border: "1px solid #E4E8F0",
  borderRadius: 14,
  padding: 22,
};
