"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { securityProducts, alertHistory } from "@/data/security-products";
import type { SecurityProduct } from "@/data/security-products";


/* ── helpers — ported directly from dashboard.html <script> ─── */

function barWidth(count: number, max: number): string {
  if (max === 0) return "24px";
  return Math.max(8, (count / max) * 100) + "%";
}

/* ── types ─── */

interface VendorUpdate {
  latestVersion: string;
  previousVersions: string[];
  updatedAt: string;
}

/* ── component ─── */

export default function ReleaseRadarPage() {
  const [hasMounted, setHasMounted] = useState(false);
  const [countdown, setCountdown] = useState("60:00");
  const [lastCheck, setLastCheck] = useState("--:--:--");
  const [vendorUpdates, setVendorUpdates] = useState<Record<string, VendorUpdate>>({});
  const [userVersions, setUserVersions] = useState<Record<string, string>>({});
  const [settingVersion, setSettingVersion] = useState<string | null>(null);
  const [versionInput, setVersionInput] = useState("");

  // Fetch vendor-updated versions from DB
  const fetchVendorUpdates = useCallback(async () => {
    try {
      const res = await fetch("/api/radar/vendor-update");
      if (res.ok) {
        const data = await res.json();
        setVendorUpdates(data.updates || {});
      }
    } catch {
      // silently fail — static data fallback
    }
  }, []);

  // Fetch user's saved current versions
  const fetchUserVersions = useCallback(async () => {
    try {
      const res = await fetch("/api/radar/versions");
      if (res.ok) {
        const data = await res.json();
        setUserVersions(data.versions || {});
      }
    } catch {
      // silently fail
    }
  }, []);

  // Hydration-safe mount detection + data fetch
  useEffect(() => {
    setHasMounted(true);
    setLastCheck(new Date().toLocaleTimeString());
    fetchVendorUpdates();
    fetchUserVersions();
  }, [fetchVendorUpdates, fetchUserVersions]);

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

  // Merge vendor DB versions into products and filter out rows with no latest version
  const visibleProducts = useMemo(() => {
    return securityProducts
      .map((p): SecurityProduct & { _resolvedLatest: string } => {
        const vendorVer = vendorUpdates[p.name]?.latestVersion || "";
        const resolvedLatest = vendorVer || p.latestVersion || "";
        return { ...p, latestVersion: resolvedLatest, _resolvedLatest: resolvedLatest };
      })
      .filter((p) => p._resolvedLatest && p._resolvedLatest !== "N/A");
  }, [vendorUpdates]);

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

  // Save user's current version for a product
  const saveCurrentVersion = async (productName: string, version: string) => {
    try {
      const res = await fetch("/api/radar/versions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productName, currentVersion: version }),
      });
      if (res.ok) {
        setUserVersions((prev) => ({ ...prev, [productName]: version }));
      }
    } catch {
      // silently fail
    }
    setSettingVersion(null);
    setVersionInput("");
  };

  const exportCSV = () => {
    let csv = "\uFEFF";
    csv += "Security Monitor Export - " + new Date().toLocaleString() + "\n\n";
    csv += "SOLUTION VERSIONS\n";
    csv += "#,Product,Vendor,Current Version,Latest Version,Source,CVEs,Patches,Status\n";
    visibleProducts.forEach((p, i) => {
      const latest = p._resolvedLatest || "N/A";
      const current = userVersions[p.name] || "";
      const st = !p.enabled ? "Disabled" : p.cveCount > 0 ? p.cveCount + " CVE" : "Clean";
      csv += `${i + 1},"${p.name}","${p.vendor}","${current}","${latest}",${(p.versionSource || "").toUpperCase()},${p.cveCount},${p.patchCount},${st}\n`;
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

  const setVersionBtn = (productName: string) => (
    <button
      onClick={() => { setSettingVersion(productName); setVersionInput(""); }}
      style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        padding: "3px 10px", borderRadius: 5, fontSize: 11, fontWeight: 600,
        fontFamily: C.mono, cursor: "pointer", transition: "all .15s",
        background: "rgba(88,166,255,.08)", color: C.blue,
        border: `1px solid rgba(88,166,255,.25)`,
      }}
    >
      Set Version
    </button>
  );

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
          <div style={S.value}>{visibleProducts.length}</div>
          <div style={S.sub}>With version data</div>
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
          <span style={{ marginLeft: "auto", fontWeight: 400, textTransform: "none", fontSize: 12, color: "#586069" }}>{visibleProducts.length} products</span>
        </h3>

        {/* Version input modal overlay */}
        {settingVersion && (
          <div style={{ padding: "12px 22px", background: "rgba(88,166,255,.06)", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: C.text, fontWeight: 600 }}>Set Current Version for <span style={{ color: C.blue }}>{settingVersion}</span>:</span>
            <input
              type="text"
              value={versionInput}
              onChange={(e) => setVersionInput(e.target.value)}
              placeholder="e.g. 10.3.0"
              style={{
                background: C.bg, border: `1px solid ${C.border}`, borderRadius: 6,
                padding: "6px 12px", fontSize: 12, color: C.text, fontFamily: C.mono,
                outline: "none", width: 160,
              }}
              onKeyDown={(e) => { if (e.key === "Enter" && versionInput.trim()) saveCurrentVersion(settingVersion, versionInput.trim()); }}
              autoFocus
            />
            <button
              onClick={() => { if (versionInput.trim()) saveCurrentVersion(settingVersion, versionInput.trim()); }}
              style={{ ...S.actionBtn, borderColor: "rgba(46,204,113,.3)", color: C.green, padding: "6px 14px" }}
            >
              Save
            </button>
            <button
              onClick={() => { setSettingVersion(null); setVersionInput(""); }}
              style={{ ...S.actionBtn, borderColor: "rgba(233,69,96,.3)", color: C.accent, padding: "6px 14px" }}
            >
              Cancel
            </button>
          </div>
        )}

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
              {visibleProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 40, textAlign: "center", color: C.muted }}>
                    No products with version data. Vendors must publish version updates first.
                  </td>
                </tr>
              ) : (
                visibleProducts.map((p, i) => {
                  // Status dot
                  const dotColor = !p.enabled ? C.muted : p.cveCount > 0 ? C.orange : C.green;

                  /* ── Current Version cell — only from DB ── */
                  const savedVersion = userVersions[p.name];
                  const currentVerCell = savedVersion
                    ? verBadge(savedVersion, undefined, "rgba(46,204,113,.12)", C.green)
                    : setVersionBtn(p.name);

                  /* ── Latest Version cell ── */
                  const latestVerCell = verBadge(p._resolvedLatest, p.versionLink);

                  /* ── Status cell ── */
                  let statusCell: React.ReactNode;
                  if (!p.enabled) {
                    statusCell = <span style={{ color: C.muted }}>Disabled</span>;
                  } else if (p.cveCount > 0) {
                    statusCell = <span style={{ color: C.red }}>{p.cveCount} CVE{p.patchCount > 0 ? `, ${p.patchCount} Patch` : ""}</span>;
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
                      <td style={S.td}>{currentVerCell}</td>
                      <td style={S.td}>{latestVerCell}</td>
                      <td style={S.td}>{srcBadge(p.versionSource, p.versionLink)}</td>
                      <td style={S.td}>{statusCell}</td>
                    </tr>
                  );
                })
              )}
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
