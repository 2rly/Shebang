"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { securityProducts, alertHistory } from "@/data/security-products";
import { useAuth } from "@/components/auth/AuthProvider";

/* ── helpers — ported directly from dashboard.html <script> ─── */

function barWidth(count: number, max: number): string {
  if (max === 0) return "24px";
  return Math.max(8, (count / max) * 100) + "%";
}

/**
 * Normalise a version string for comparison.
 * Strips leading "v", trims whitespace, lowercases, and splits into
 * numeric / alphanumeric segments so "10.4.0" > "10.3.0" works correctly.
 */
function normParts(v: string): (number | string)[] {
  return v
    .replace(/^v/i, "")
    .trim()
    .toLowerCase()
    .split(/[.\-+_ ]+/)
    .map((p) => (/^\d+$/.test(p) ? Number(p) : p));
}

function versionsEqual(a: string, b: string): boolean {
  return a.replace(/^v/i, "").trim().toLowerCase() === b.replace(/^v/i, "").trim().toLowerCase();
}

/**
 * Compare two version strings.
 * Returns -1 if a < b, 0 if equal, 1 if a > b.
 */
function compareVersions(a: string, b: string): number {
  if (versionsEqual(a, b)) return 0;
  const pa = normParts(a);
  const pb = normParts(b);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const sa = pa[i] ?? 0;
    const sb = pb[i] ?? 0;
    if (typeof sa === "number" && typeof sb === "number") {
      if (sa < sb) return -1;
      if (sa > sb) return 1;
    } else {
      const cmp = String(sa).localeCompare(String(sb));
      if (cmp !== 0) return cmp;
    }
  }
  return 0;
}

type VerStatus = "match" | "outdated" | "empty" | "unknown";

function versionStatus(cur: string, latest: string): VerStatus {
  if (!cur) return "empty";
  if (!latest || latest === "N/A" || latest === "SaaS") return "unknown";
  if (versionsEqual(cur, latest)) return "match";
  return compareVersions(cur, latest) < 0 ? "outdated" : "match";
}

/* ── component ─── */

export default function ReleaseRadarPage() {
  const { user, setShowAuthModal } = useAuth();
  const [hasMounted, setHasMounted] = useState(false);
  const [countdown, setCountdown] = useState("60:00");
  const [lastCheck, setLastCheck] = useState("--:--:--");

  // Current-version map: product name → user-entered version string
  const [savedVersions, setSavedVersions] = useState<Record<string, string>>({});
  // Track which row is in "editing" mode (product name)
  const [editingRow, setEditingRow] = useState<string | null>(null);
  // Temp input value while editing
  const [editValue, setEditValue] = useState("");

  // Hydration-safe mount detection
  useEffect(() => {
    setHasMounted(true);
    setLastCheck(new Date().toLocaleTimeString());
  }, []);

  // Fetch versions from API when user logs in
  useEffect(() => {
    if (!user) {
      setSavedVersions({});
      return;
    }
    fetch("/api/radar/versions")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.versions) setSavedVersions(data.versions);
      })
      .catch(() => {});
  }, [user]);

  // Tick countdown every second like dashboard.html
  useEffect(() => {
    let seconds = 3600;
    const id = setInterval(() => {
      seconds = Math.max(0, seconds - 1);
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      setCountdown(`${m}:${String(s).padStart(2, "0")}`);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  /** Commit a version for a product — optimistic UI + persist to API */
  const commitVersion = useCallback((productName: string, version: string) => {
    const v = version.trim();
    if (!v) return;
    setSavedVersions((prev) => ({ ...prev, [productName]: v }));
    setEditingRow(null);
    setEditValue("");
    // Persist in background
    fetch("/api/radar/versions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productName, currentVersion: v }),
    }).catch(() => {});
  }, []);

  /** Handle "Set Version" click — gate behind auth */
  const handleSetVersionClick = useCallback((productName: string) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setEditingRow(productName);
    setEditValue("");
  }, [user, setShowAuthModal]);

  /** Handle "Set to Latest" click — gate behind auth */
  const handleSetLatestClick = useCallback((productName: string, latestVersion: string) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    commitVersion(productName, latestVersion);
  }, [user, setShowAuthModal, commitVersion]);

  /** Get effective current version: saved (API) > static data */
  const getCurrent = useCallback(
    (p: typeof securityProducts[number]): string => {
      return savedVersions[p.name] || (user ? "" : p.currentVersion || "");
    },
    [savedVersions, user],
  );

  const stats = useMemo(() => {
    const products = securityProducts;
    const enabled = products.filter((p) => p.enabled).length;
    const totalCves = products.reduce((s, p) => s + p.cveCount, 0);
    const totalPatches = products.reduce((s, p) => s + p.patchCount, 0);
    const totalVersionAlerts = alertHistory.filter((a) => a.type === "version").length;
    const sev = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
    alertHistory.forEach((a) => {
      if (a.severity in sev) sev[a.severity as keyof typeof sev]++;
    });
    const weekTotal = totalCves + totalPatches + totalVersionAlerts;
    return { enabled, weekTotal, totalCves, totalPatches, totalVersionAlerts, sev };
  }, []);

  const cveAlerts = alertHistory.filter((a) => a.type === "cve" || a.type === "patch");
  const maxType = Math.max(stats.totalCves, stats.totalPatches, stats.totalVersionAlerts, 1);
  const maxSev = Math.max(...Object.values(stats.sev), 1);

  const exportCSV = () => {
    let csv = "\uFEFF";
    csv += "Security Monitor Export - " + new Date().toLocaleString() + "\n\n";
    csv += "SOLUTION VERSIONS\n";
    csv += "#,Product,Vendor,Current Version,Latest Version,Source,CVEs,Patches,Status\n";
    securityProducts.forEach((p, i) => {
      const cur = getCurrent(p) || "—";
      const ver = p.latestVersion || "N/A";
      const st = !p.enabled ? "Disabled" : p.cveCount > 0 ? p.cveCount + " CVE" : "Clean";
      csv += `${i + 1},"${p.name}","${p.vendor}","${cur}","${ver}",${(p.versionSource || "").toUpperCase()},${p.cveCount},${p.patchCount},${st}\n`;
    });
    csv += "\n\nCVE / VULNERABILITY ALERTS\n";
    csv += "Type,Product,Title,Severity,Date,Link\n";
    cveAlerts.forEach((a) => {
      const tl = a.type === "cve" ? "CVE / Vulnerability" : "Critical Patch";
      csv += `"${tl}","${a.product}","${a.title.replace(/"/g, '""')}","${a.severity}","${a.date}","${a.link}"\n`;
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `security_monitor_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /*
   * The entire render below uses raw inline styles that exactly match
   * the dashboard.html CSS values.  This guarantees a 1:1 visual clone
   * regardless of Tailwind preflight or parent layout styles.
   */

  // Shared style constants — mirrors dashboard.html :root
  const C = {
    bg:     "#0d1117",
    card:   "#161b22",
    border: "#21262d",
    text:   "#c9d1d9",
    muted:  "#484f58",
    accent: "#e94560",
    blue:   "#58a6ff",
    green:  "#2ecc71",
    orange: "#e67e22",
    yellow: "#f1c40f",
    red:    "#e74c3c",
    purple: "#a855f7",
    mono:   "'Cascadia Code','Consolas','JetBrains Mono',monospace",
  } as const;

  const S = {
    statCard: { background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "18px 20px" } as React.CSSProperties,
    label:    { fontSize: 10, textTransform: "uppercase" as const, letterSpacing: ".8px", color: C.muted, marginBottom: 5 },
    value:    { fontSize: 28, fontWeight: 700, color: C.text, lineHeight: 1.1 } as React.CSSProperties,
    sub:      { fontSize: 11, color: C.muted, marginTop: 3 },
    chartCard:{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 22 } as React.CSSProperties,
    chartH3:  { fontSize: 13, marginBottom: 14, color: C.muted, textTransform: "uppercase" as const, letterSpacing: ".5px", fontWeight: 400 },
    barRow:   { display: "flex", alignItems: "center", gap: 10, marginBottom: 10 } as React.CSSProperties,
    barLabel: { width: 70, fontSize: 12, textAlign: "right" as const, color: C.muted },
    barTrack: { flex: 1, height: 24, background: C.bg, borderRadius: 6, overflow: "hidden" as const } as React.CSSProperties,
    sectionCard: { background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" as const, marginBottom: 28 } as React.CSSProperties,
    sectionH3: { padding: "18px 22px", fontSize: 14, color: C.muted, textTransform: "uppercase" as const, letterSpacing: ".5px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 10, margin: 0, fontWeight: 600 } as React.CSSProperties,
    th: { background: C.bg, padding: "10px 14px", textAlign: "left" as const, fontSize: 10, textTransform: "uppercase" as const, letterSpacing: ".8px", color: C.muted, fontWeight: 600 } as React.CSSProperties,
    td: { padding: "10px 14px", borderBottom: `1px solid ${C.border}`, fontSize: 13, color: C.text } as React.CSSProperties,
    actionBtn: { display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 18px", border: `1px solid ${C.border}`, borderRadius: 8, background: C.card, fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all .15s", fontFamily: "inherit" } as React.CSSProperties,
  };

  const barFillStyle = (w: string, color: string): React.CSSProperties => ({
    height: "100%", borderRadius: 6, display: "flex", alignItems: "center",
    paddingLeft: 10, fontSize: 11, fontWeight: 700, color: "#fff",
    minWidth: 24, transition: "width .6s ease", width: w, background: color,
  });

  const verBadge = (version: string, link?: string, overrideBg?: string, overrideColor?: string) => {
    const badgeColor = overrideColor || C.blue;
    const style: React.CSSProperties = {
      display: "inline-block", padding: "3px 10px", borderRadius: 5,
      fontSize: 12, fontWeight: 700, letterSpacing: ".3px",
      fontFamily: C.mono,
      background: overrideBg || "rgba(88,166,255,.12)",
      color: badgeColor,
    };
    if (link) {
      return (
        <a href={link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={style}>{version}</span>
          <span style={{ fontSize: 11, color: badgeColor, opacity: 0.7 }}>↗</span>
        </a>
      );
    }
    return <span style={style}>{version}</span>;
  };

  const naBadge = <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 5, fontSize: 12, fontWeight: 700, fontFamily: C.mono, background: "rgba(72,79,88,.15)", color: C.muted }}>N/A</span>;

  const srcBadge = (src: string, link?: string) => {
    const map: Record<string, { bg: string; color: string }> = {
      rss: { bg: "rgba(168,85,247,.12)", color: C.purple },
      web: { bg: "rgba(88,166,255,.12)", color: C.blue },
      nvd: { bg: "rgba(230,126,34,.12)", color: C.orange },
    };
    const s = map[src];
    if (!s) return null;
    const badge = <span style={{ display: "inline-block", padding: "1px 6px", borderRadius: 3, fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".5px", background: s.bg, color: s.color }}>{src}</span>;
    if (link) {
      let domain = "";
      try { domain = new URL(link).hostname.replace(/^www\./, ""); } catch { /* */ }
      return (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          {badge}
          <a href={link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, color: C.muted, textDecoration: "none", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "inline-block" }} title={link}>
            {domain}
          </a>
        </span>
      );
    }
    return badge;
  };

  const sevBadge = (sev: string) => {
    const map: Record<string, { bg: string; color: string }> = {
      CRITICAL: { bg: C.red, color: "#fff" },
      HIGH:     { bg: C.orange, color: "#fff" },
      MEDIUM:   { bg: C.yellow, color: "#000" },
      LOW:      { bg: C.green, color: "#fff" },
      UNKNOWN:  { bg: C.muted, color: "#fff" },
    };
    const s = map[sev] || map.UNKNOWN;
    return <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700, letterSpacing: ".5px", background: s.bg, color: s.color }}>{sev}</span>;
  };

  /* ── input styles ─── */
  const inputStyle: React.CSSProperties = {
    padding: "4px 8px", borderRadius: 5, border: `1px solid ${C.border}`,
    background: C.bg, color: C.text, fontSize: 12, fontFamily: C.mono,
    width: 110, outline: "none",
  };
  const setBtnStyle: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", gap: 3, padding: "3px 10px",
    borderRadius: 4, border: `1px solid rgba(46,204,113,.4)`,
    background: "rgba(46,204,113,.12)", color: C.green,
    fontSize: 10, fontWeight: 700, cursor: "pointer", textTransform: "uppercase",
    letterSpacing: ".3px", fontFamily: "inherit", whiteSpace: "nowrap",
  };
  const setLatestBtnStyle: React.CSSProperties = {
    ...setBtnStyle,
    border: `1px solid rgba(88,166,255,.4)`,
    background: "rgba(88,166,255,.10)",
    color: C.blue,
  };

  return (
    <div style={{ background: C.bg, color: C.text, fontFamily: "'Segoe UI',Roboto,Helvetica,sans-serif", padding: "24px 20px", height: "100%", overflowY: "auto" }}>
      {/* Pulse animation */}
      <style>{`@keyframes rr-pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>

      {/* ═══════════ HEADER — .header ═══════════ */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: C.text }}>
          🛡️ Security <span style={{ color: C.accent }}>Monitor</span>
        </h1>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 16px", borderRadius: 20, fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".5px", background: "rgba(46,204,113,.12)", color: C.green, border: "1px solid rgba(46,204,113,.3)" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.green, animation: "rr-pulse 2s infinite", display: "inline-block" }} />
          Running
        </span>
      </div>

      {/* ═══════════ ACTION BAR — .action-bar ═══════════ */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
        <button onClick={exportCSV} style={{ ...S.actionBtn, borderColor: "rgba(46,204,113,.3)", color: C.green }}>
          📊 Export to Excel
        </button>
        <button style={{ ...S.actionBtn, borderColor: "rgba(88,166,255,.3)", color: C.blue }}>
          ➕ Add Solution
        </button>
        <button style={{ ...S.actionBtn, borderColor: "rgba(233,69,96,.3)", color: C.accent }}>
          ✖ Delete Solution
        </button>
      </div>

      {/* ═══════════ STAT CARDS — .stats ═══════════ */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 14, marginBottom: 28 }}>
        <div style={S.statCard}>
          <div style={S.label}>Alerts This Week</div>
          <div style={S.value}>{stats.weekTotal}</div>
          <div style={S.sub}>{stats.totalCves} CVE · {stats.totalPatches} Patch · {stats.totalVersionAlerts} Version</div>
        </div>
        <div style={S.statCard}>
          <div style={S.label}>CVEs Found</div>
          <div style={{ ...S.value, color: C.red }}>{stats.totalCves}</div>
          <div style={S.sub}>This week</div>
        </div>
        <div style={S.statCard}>
          <div style={S.label}>Last Check</div>
          <div style={{ ...S.value, fontSize: 17 }}>{hasMounted ? lastCheck : "--:--:--"}</div>
          <div style={S.sub}>Just now</div>
        </div>
        <div style={S.statCard}>
          <div style={S.label}>Next Check</div>
          <div style={{ ...S.value, fontSize: 17, color: C.blue }}>{hasMounted ? countdown : "60:00"}</div>
          <div style={S.sub}>Auto-refresh</div>
        </div>
        <div style={S.statCard}>
          <div style={S.label}>Products</div>
          <div style={S.value}>{stats.enabled}</div>
          <div style={S.sub}>Monitored</div>
        </div>
      </div>

      {/* ═══════════ CHARTS — .charts ═══════════ */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 28 }}>
        <div style={S.chartCard}>
          <h3 style={S.chartH3}>Alerts This Week by Type</h3>
          <div style={S.barRow}>
            <div style={S.barLabel}>CVE</div>
            <div style={S.barTrack}><div style={barFillStyle(barWidth(stats.totalCves, maxType), C.red)}>{stats.totalCves}</div></div>
          </div>
          <div style={S.barRow}>
            <div style={S.barLabel}>Patch</div>
            <div style={S.barTrack}><div style={barFillStyle(barWidth(stats.totalPatches, maxType), C.orange)}>{stats.totalPatches}</div></div>
          </div>
          <div style={S.barRow}>
            <div style={S.barLabel}>Version</div>
            <div style={S.barTrack}><div style={barFillStyle(barWidth(stats.totalVersionAlerts, maxType), C.blue)}>{stats.totalVersionAlerts}</div></div>
          </div>
        </div>
        <div style={S.chartCard}>
          <h3 style={S.chartH3}>Severity Distribution</h3>
          <div style={S.barRow}>
            <div style={S.barLabel}>Critical</div>
            <div style={S.barTrack}><div style={barFillStyle(barWidth(stats.sev.CRITICAL, maxSev), C.red)}>{stats.sev.CRITICAL}</div></div>
          </div>
          <div style={S.barRow}>
            <div style={S.barLabel}>High</div>
            <div style={S.barTrack}><div style={barFillStyle(barWidth(stats.sev.HIGH, maxSev), C.orange)}>{stats.sev.HIGH}</div></div>
          </div>
          <div style={S.barRow}>
            <div style={S.barLabel}>Medium</div>
            <div style={S.barTrack}><div style={barFillStyle(barWidth(stats.sev.MEDIUM, maxSev), C.yellow)}>{stats.sev.MEDIUM}</div></div>
          </div>
          <div style={S.barRow}>
            <div style={S.barLabel}>Low</div>
            <div style={S.barTrack}><div style={barFillStyle(barWidth(stats.sev.LOW, maxSev), C.green)}>{stats.sev.LOW}</div></div>
          </div>
        </div>
      </div>

      {/* ═══════════ SECTION 1: SOLUTION VERSIONS — .section-card ═══════════ */}
      <div style={S.sectionCard}>
        <h3 style={S.sectionH3}>
          <span style={{ fontSize: 18 }}>📦</span> Solution Versions
          <span style={{ marginLeft: "auto", fontWeight: 400, textTransform: "none", fontSize: 12, color: "#586069" }}>{stats.enabled} products</span>
        </h3>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                <th style={{ ...S.th, width: 30 }}>#</th>
                <th style={S.th}>Product</th>
                <th style={S.th}>Vendor</th>
                <th style={S.th}>Current Version</th>
                <th style={S.th}>Latest Version</th>
                <th style={S.th}>Source</th>
                <th style={S.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {securityProducts.map((p, i) => {
                const curVer = getCurrent(p);
                const vs = versionStatus(curVer, p.latestVersion);
                const hasLatest = !!(p.latestVersion && p.latestVersion !== "N/A");
                const isEditing = editingRow === p.name;

                // Status dot
                const dotColor = !p.enabled ? C.muted : p.cveCount > 0 ? C.orange : C.green;

                /* ── Current Version cell ── */
                let curVerCell: React.ReactNode;

                if (curVer) {
                  // ── LOCKED STATE: version is set ──
                  const badgeBg = vs === "match" || vs === "unknown"
                    ? "rgba(46,204,113,.12)"
                    : "rgba(231,76,60,.15)";
                  const badgeCol = vs === "match" || vs === "unknown" ? C.green : C.red;
                  curVerCell = (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                      <span style={{
                        display: "inline-block", padding: "3px 10px", borderRadius: 5,
                        fontSize: 12, fontWeight: 700, letterSpacing: ".3px",
                        fontFamily: C.mono, background: badgeBg, color: badgeCol,
                      }}>
                        {curVer}
                      </span>
                      {vs === "match" && <span title="Up to date" style={{ fontSize: 14 }}>✅</span>}
                      {vs === "outdated" && (
                        <span title={`Update available: ${p.latestVersion}`} style={{ fontSize: 14 }}>⚠️</span>
                      )}
                    </span>
                  );
                } else if (isEditing) {
                  // ── EDITING STATE: input field shown ──
                  curVerCell = (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                      <input
                        autoFocus
                        style={inputStyle}
                        placeholder="e.g. 10.4.0"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitVersion(p.name, editValue);
                          if (e.key === "Escape") { setEditingRow(null); setEditValue(""); }
                        }}
                      />
                      <button
                        style={{
                          ...setBtnStyle,
                          opacity: editValue.trim() ? 1 : 0.4,
                          cursor: editValue.trim() ? "pointer" : "default",
                        }}
                        disabled={!editValue.trim()}
                        onClick={() => commitVersion(p.name, editValue)}
                      >
                        ↑ SET
                      </button>
                      {hasLatest && (
                        <button
                          style={setLatestBtnStyle}
                          onClick={() => commitVersion(p.name, p.latestVersion)}
                        >
                          ↑ SET TO {p.latestVersion}
                        </button>
                      )}
                      <button
                        style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 14, padding: "2px 4px" }}
                        title="Cancel"
                        onClick={() => { setEditingRow(null); setEditValue(""); }}
                      >
                        ✕
                      </button>
                    </span>
                  );
                } else {
                  // ── EMPTY STATE: show "Set Version" button ──
                  curVerCell = (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                      <button
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 4,
                          padding: "4px 12px", borderRadius: 5,
                          border: `1px dashed ${C.muted}`,
                          background: "rgba(72,79,88,.08)", color: C.muted,
                          fontSize: 11, fontWeight: 600, cursor: "pointer",
                          fontFamily: "inherit", letterSpacing: ".3px",
                          transition: "all .15s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = C.blue;
                          e.currentTarget.style.color = C.blue;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = C.muted;
                          e.currentTarget.style.color = C.muted;
                        }}
                        onClick={() => handleSetVersionClick(p.name)}
                      >
                        ✎ Set Version
                      </button>
                      {hasLatest && (
                        <button
                          style={setLatestBtnStyle}
                          onClick={() => handleSetLatestClick(p.name, p.latestVersion)}
                        >
                          ↑ SET TO {p.latestVersion}
                        </button>
                      )}
                    </span>
                  );
                }

                /* ── Latest Version cell — color-coded based on comparison ── */
                let latestVerCell: React.ReactNode;
                if (!hasLatest) {
                  latestVerCell = naBadge;
                } else if (vs === "outdated") {
                  // Highlight latest in orange/red to signal update needed
                  latestVerCell = verBadge(p.latestVersion, p.versionLink, "rgba(230,126,34,.15)", C.orange);
                } else {
                  latestVerCell = verBadge(p.latestVersion, p.versionLink);
                }

                /* ── Status cell — includes version comparison result ── */
                let statusCell: React.ReactNode;
                if (!p.enabled) {
                  statusCell = <span style={{ color: C.muted }}>Disabled</span>;
                } else if (p.cveCount > 0) {
                  statusCell = <span style={{ color: C.red }}>{p.cveCount} CVE{p.patchCount > 0 ? `, ${p.patchCount} Patch` : ""}</span>;
                } else if (vs === "outdated") {
                  statusCell = (
                    <span style={{
                      display: "inline-block", padding: "2px 8px", borderRadius: 4,
                      fontSize: 10, fontWeight: 700, letterSpacing: ".5px",
                      background: "rgba(230,126,34,.15)", color: C.orange,
                    }}>
                      UPDATE
                    </span>
                  );
                } else if (vs === "match") {
                  statusCell = <span style={{ color: C.green }}>Clean</span>;
                } else {
                  statusCell = <span style={{ color: C.green }}>Clean</span>;
                }

                return (
                  <tr key={p.name} style={{ cursor: "default" }} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(88,166,255,.03)"; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; }}>
                    <td style={{ ...S.td, color: C.muted, fontSize: 11 }}>{i + 1}</td>
                    <td style={S.td}>
                      <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: dotColor, marginRight: 6 }} />
                      <strong>{p.name}</strong>
                    </td>
                    <td style={{ ...S.td, color: C.muted }}>{p.vendor}</td>
                    <td style={S.td}>{curVerCell}</td>
                    <td style={S.td}>{latestVerCell}</td>
                    <td style={S.td}>{srcBadge(p.versionSource, p.versionLink)}</td>
                    <td style={S.td}>{statusCell}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══════════ SECTION 2: CVE / VULNERABILITIES & PATCHES ═══════════ */}
      <div style={S.sectionCard}>
        <h3 style={S.sectionH3}>
          <span style={{ fontSize: 18 }}>🚨</span> CVE / Vulnerabilities &amp; Patches
          <span style={{ marginLeft: "auto", fontWeight: 400, textTransform: "none", fontSize: 12, color: "#586069" }}>{cveAlerts.length} alert{cveAlerts.length !== 1 ? "s" : ""}</span>
        </h3>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                <th style={S.th}>Type</th>
                <th style={S.th}>Product</th>
                <th style={S.th}>Title</th>
                <th style={S.th}>Severity</th>
                <th style={S.th}>Date</th>
                <th style={S.th}>Link</th>
              </tr>
            </thead>
            <tbody>
              {cveAlerts.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: 40, textAlign: "center", color: C.muted }}>No CVE or patch alerts yet. Your products are clean!</td></tr>
              ) : (
                cveAlerts.map((a) => (
                  <tr key={a.id} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(88,166,255,.03)"; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; }}>
                    <td style={{ ...S.td, whiteSpace: "nowrap" }}>
                      {a.type === "cve" ? "🚨 CVE / Vulnerability" : "🛡️ Critical Patch"}
                    </td>
                    <td style={{ ...S.td, fontWeight: 600 }}>{a.product}</td>
                    <td style={{ ...S.td, maxWidth: 340 }}>{a.title}</td>
                    <td style={S.td}>{sevBadge(a.severity)}</td>
                    <td style={{ ...S.td, whiteSpace: "nowrap" }}>{a.date || "—"}</td>
                    <td style={S.td}>
                      {a.link ? (
                        <a href={a.link} target="_blank" rel="noopener noreferrer" style={{ color: C.blue, textDecoration: "none" }}>↗ Details</a>
                      ) : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══════════ FOOTER — .footer ═══════════ */}
      <div style={{ textAlign: "center", padding: "24px 0 12px", fontSize: 11, color: C.muted }}>
        Security Monitor Dashboard &bull; Auto-refreshes every 30 seconds &bull; Reads from status.json
      </div>
    </div>
  );
}
