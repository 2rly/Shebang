"use client";

import { useState, useMemo } from "react";
import {
  Radio,
  ExternalLink,
  Search,
  ShieldAlert,
  Package,
  ArrowUpCircle,
  CheckCircle2,
  AlertTriangle,
  CircleDot,
  Filter,
} from "lucide-react";
import { securityProducts, SecurityProduct } from "@/data/security-products";

type FilterMode = "all" | "outdated" | "cve" | "no-version";

function versionStatus(p: SecurityProduct): "current" | "outdated" | "unknown" {
  if (!p.currentVersion || !p.latestVersion) return "unknown";
  const norm = (v: string) => v.replace(/^v/i, "").trim().toLowerCase();
  return norm(p.currentVersion) === norm(p.latestVersion) ? "current" : "outdated";
}

export default function ReleaseRadarPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterMode>("all");

  const stats = useMemo(() => {
    const total = securityProducts.length;
    const withVersion = securityProducts.filter((p) => p.latestVersion).length;
    const outdated = securityProducts.filter(
      (p) => versionStatus(p) === "outdated"
    ).length;
    const totalCves = securityProducts.reduce((s, p) => s + p.cveCount, 0);
    const totalPatches = securityProducts.reduce((s, p) => s + p.patchCount, 0);
    return { total, withVersion, outdated, totalCves, totalPatches };
  }, []);

  const filtered = useMemo(() => {
    let list = securityProducts;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.vendor.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }
    switch (filter) {
      case "outdated":
        list = list.filter((p) => versionStatus(p) === "outdated");
        break;
      case "cve":
        list = list.filter((p) => p.cveCount > 0);
        break;
      case "no-version":
        list = list.filter((p) => !p.latestVersion);
        break;
    }
    return list;
  }, [searchQuery, filter]);

  return (
    <div className="px-4 pt-3 pb-2 h-full flex flex-col">
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Radio className="w-5 h-5 text-cyber-primary flex-shrink-0" />
          <h1 className="text-lg font-bold text-cyber-text">
            Release <span className="text-cyber-primary">Radar</span>
          </h1>
          <span className="text-xs text-cyber-muted hidden sm:inline">
            — {stats.total} security solutions monitored
          </span>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-3">
        <div className="bg-cyber-surface border border-cyber-border rounded-lg px-3 py-2">
          <div className="text-[10px] uppercase tracking-wider text-cyber-muted">Products</div>
          <div className="text-xl font-bold font-mono text-cyber-text">{stats.total}</div>
        </div>
        <div className="bg-cyber-surface border border-cyber-border rounded-lg px-3 py-2">
          <div className="text-[10px] uppercase tracking-wider text-cyber-muted">Versioned</div>
          <div className="text-xl font-bold font-mono text-cyber-secondary">{stats.withVersion}</div>
        </div>
        <div className="bg-cyber-surface border border-cyber-border rounded-lg px-3 py-2">
          <div className="text-[10px] uppercase tracking-wider text-cyber-muted">Outdated</div>
          <div className="text-xl font-bold font-mono text-cyber-warning">{stats.outdated}</div>
        </div>
        <div className="bg-cyber-surface border border-cyber-border rounded-lg px-3 py-2">
          <div className="text-[10px] uppercase tracking-wider text-cyber-muted">CVEs</div>
          <div className="text-xl font-bold font-mono text-cyber-accent">{stats.totalCves}</div>
        </div>
        <div className="bg-cyber-surface border border-cyber-border rounded-lg px-3 py-2">
          <div className="text-[10px] uppercase tracking-wider text-cyber-muted">Patches</div>
          <div className="text-xl font-bold font-mono text-cyber-warning">{stats.totalPatches}</div>
        </div>
      </div>

      {/* Search + filter row */}
      <div className="flex gap-2 mb-3">
        <div className="flex-1 flex items-center bg-cyber-bg border border-cyber-border rounded-lg px-3 py-1.5 focus-within:border-cyber-primary transition-colors">
          <span className="text-cyber-primary font-mono text-sm mr-2">$</span>
          <Search className="w-4 h-4 text-cyber-muted mr-2 flex-shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products, vendors, categories..."
            className="flex-1 bg-transparent outline-none font-mono text-sm text-cyber-text placeholder:text-cyber-muted/40"
          />
        </div>
        <div className="flex items-center gap-1">
          <Filter className="w-4 h-4 text-cyber-muted flex-shrink-0" />
          {(["all", "outdated", "cve", "no-version"] as FilterMode[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2.5 py-1.5 text-xs font-mono rounded-lg border transition-colors ${
                filter === f
                  ? "border-cyber-primary bg-cyber-primary/10 text-cyber-primary"
                  : "border-cyber-border bg-cyber-surface text-cyber-muted hover:text-cyber-text"
              }`}
            >
              {f === "all" ? "All" : f === "outdated" ? "Outdated" : f === "cve" ? "CVEs" : "No Ver"}
            </button>
          ))}
        </div>
      </div>

      {/* Product table */}
      <div className="flex-1 min-h-0 overflow-auto rounded-lg border border-cyber-border">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="bg-cyber-surface text-[10px] uppercase tracking-wider text-cyber-muted">
              <th className="text-left px-3 py-2.5 font-semibold">#</th>
              <th className="text-left px-3 py-2.5 font-semibold">Product</th>
              <th className="text-left px-3 py-2.5 font-semibold hidden lg:table-cell">Vendor</th>
              <th className="text-left px-3 py-2.5 font-semibold hidden md:table-cell">Category</th>
              <th className="text-left px-3 py-2.5 font-semibold">Current</th>
              <th className="text-left px-3 py-2.5 font-semibold">Latest</th>
              <th className="text-center px-3 py-2.5 font-semibold hidden sm:table-cell">Source</th>
              <th className="text-center px-3 py-2.5 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, i) => {
              const vs = versionStatus(p);
              return (
                <tr
                  key={p.name}
                  className="border-t border-cyber-border/50 hover:bg-cyber-primary/[0.03] transition-colors"
                >
                  {/* # */}
                  <td className="px-3 py-2.5 text-cyber-muted font-mono text-xs">
                    {i + 1}
                  </td>

                  {/* Product name */}
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <CircleDot
                        className={`w-2.5 h-2.5 flex-shrink-0 ${
                          p.cveCount > 0
                            ? "text-cyber-accent"
                            : vs === "outdated"
                            ? "text-cyber-warning"
                            : "text-cyber-primary"
                        }`}
                      />
                      <span className="font-semibold text-cyber-text">{p.name}</span>
                    </div>
                  </td>

                  {/* Vendor */}
                  <td className="px-3 py-2.5 text-cyber-muted hidden lg:table-cell">
                    {p.vendor}
                  </td>

                  {/* Category */}
                  <td className="px-3 py-2.5 hidden md:table-cell">
                    <span className="px-2 py-0.5 text-[11px] font-mono rounded bg-cyber-bg border border-cyber-border text-cyber-muted">
                      {p.category}
                    </span>
                  </td>

                  {/* Current version */}
                  <td className="px-3 py-2.5">
                    {p.currentVersion ? (
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-cyber-bg border border-cyber-border text-cyber-text">
                        {p.currentVersion}
                      </span>
                    ) : (
                      <span className="text-xs text-cyber-muted italic">—</span>
                    )}
                  </td>

                  {/* Latest version */}
                  <td className="px-3 py-2.5">
                    {p.latestVersion ? (
                      <span className="inline-flex items-center gap-1.5">
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-cyber-secondary/10 border border-cyber-secondary/20 text-cyber-secondary font-bold">
                          {p.latestVersion}
                        </span>
                        {p.versionLink && (
                          <a
                            href={p.versionLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyber-muted hover:text-cyber-secondary transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </span>
                    ) : (
                      <span className="text-xs text-cyber-muted italic">N/A</span>
                    )}
                  </td>

                  {/* Source */}
                  <td className="px-3 py-2.5 text-center hidden sm:table-cell">
                    {p.versionSource ? (
                      <span
                        className={`px-1.5 py-0.5 text-[10px] font-bold uppercase rounded ${
                          p.versionSource === "rss"
                            ? "bg-purple-500/10 text-purple-400"
                            : p.versionSource === "web"
                            ? "bg-cyber-secondary/10 text-cyber-secondary"
                            : "bg-cyber-warning/10 text-cyber-warning"
                        }`}
                      >
                        {p.versionSource}
                      </span>
                    ) : (
                      <span className="text-xs text-cyber-muted">—</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-3 py-2.5 text-center">
                    {p.cveCount > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold rounded bg-cyber-accent/10 text-cyber-accent">
                        <ShieldAlert className="w-3 h-3" />
                        {p.cveCount} CVE
                      </span>
                    ) : vs === "outdated" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold rounded bg-cyber-warning/10 text-cyber-warning">
                        <ArrowUpCircle className="w-3 h-3" />
                        Update
                      </span>
                    ) : vs === "current" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold rounded bg-cyber-primary/10 text-cyber-primary">
                        <CheckCircle2 className="w-3 h-3" />
                        OK
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] rounded bg-cyber-bg text-cyber-muted">
                        <AlertTriangle className="w-3 h-3" />
                        N/A
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="py-12 text-center text-cyber-muted">
                  <Package className="w-10 h-10 mx-auto mb-2 opacity-20" />
                  <p>No products match your search.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
