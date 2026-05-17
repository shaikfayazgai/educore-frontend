"use client";

import { useState, useCallback } from "react";
import {
  Network,
  LayoutGrid,
  GitFork,
  Mail,
  ExternalLink,
} from "lucide-react";
import {
  useCollaborators,
  useCollaborationGraph,
} from "@/superadmin/lib/hooks/use-research";
import { PageHeader } from "@/superadmin/components/shared/misc/page-header";
import { SearchInput } from "@/superadmin/components/shared/forms/search-input";
import { CardSkeleton } from "@/superadmin/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/superadmin/components/shared/feedback/error-state";
import { EmptyState } from "@/superadmin/components/shared/feedback/empty-state";
import { cn } from "@/superadmin/lib/utils/cn";

type ViewMode = "grid" | "graph";

export default function ResearchCollaborationsPage() {
  const [search, setSearch] = useState("");
  const [view, setView] = useState<ViewMode>("grid");

  const {
    data: collaborators,
    isLoading,
    isError,
    refetch,
  } = useCollaborators({ search: search || undefined });

  const { data: graph } = useCollaborationGraph();

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Network}
        title="Collaborations"
        description="Your research collaboration network"
      />

      {/* Controls: search + view toggle */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          onSearch={handleSearch}
          placeholder="Search by name, institution, or expertise..."
          className="w-full sm:max-w-md"
        />
        <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/50 p-1">
          <button
            onClick={() => setView("grid")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              view === "grid"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Grid
          </button>
          <button
            onClick={() => setView("graph")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              view === "graph"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <GitFork className="h-3.5 w-3.5" />
            Graph
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <ErrorState
          title="Failed to load collaborators"
          message="Could not retrieve your collaboration network. Please try again."
          onRetry={() => refetch()}
        />
      ) : view === "graph" ? (
        /* Graph View */
        <div className="rounded-xl border border-border bg-card p-6">
          {graph ? (
            <div className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-3xl font-semibold">
                    {graph.nodes.length}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Collaborators
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-semibold">
                    {graph.edges.length}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Connections
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-semibold">
                    {new Set(graph.nodes.map((n) => n.institution)).size}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Institutions
                  </p>
                </div>
              </div>

              {/* Visual network representation */}
              <div className="relative h-[400px] rounded-lg bg-muted/30 overflow-hidden">
                <svg
                  width="100%"
                  height="100%"
                  viewBox="0 0 600 400"
                  className="absolute inset-0"
                >
                  {/* Edges */}
                  {graph.edges.map((edge, i) => {
                    const sourceNode = graph.nodes.find(
                      (n) => n.id === edge.source
                    );
                    const targetNode = graph.nodes.find(
                      (n) => n.id === edge.target
                    );
                    if (!sourceNode || !targetNode) return null;
                    const si = graph.nodes.indexOf(sourceNode);
                    const ti = graph.nodes.indexOf(targetNode);
                    const angle1 =
                      (2 * Math.PI * si) / graph.nodes.length - Math.PI / 2;
                    const angle2 =
                      (2 * Math.PI * ti) / graph.nodes.length - Math.PI / 2;
                    const r = 150;
                    const cx = 300;
                    const cy = 200;
                    return (
                      <line
                        key={i}
                        x1={cx + r * Math.cos(angle1)}
                        y1={cy + r * Math.sin(angle1)}
                        x2={cx + r * Math.cos(angle2)}
                        y2={cy + r * Math.sin(angle2)}
                        stroke="#d1d5db"
                        strokeWidth={Math.max(1, edge.strength * 3)}
                        strokeOpacity={0.5}
                      />
                    );
                  })}
                  {/* Nodes */}
                  {graph.nodes.map((node, i) => {
                    const angle =
                      (2 * Math.PI * i) / graph.nodes.length - Math.PI / 2;
                    const r = 150;
                    const cx = 300 + r * Math.cos(angle);
                    const cy = 200 + r * Math.sin(angle);
                    const colors = [
                      "#2563eb",
                      "#7c3aed",
                      "#059669",
                      "#d97706",
                      "#dc2626",
                      "#0891b2",
                    ];
                    return (
                      <g key={node.id}>
                        <circle
                          cx={cx}
                          cy={cy}
                          r={8}
                          fill={colors[node.group % colors.length]}
                          opacity={0.8}
                        />
                        <text
                          x={cx}
                          y={cy + 20}
                          textAnchor="middle"
                          className="fill-muted-foreground text-[10px]"
                        >
                          {node.name.split(" ").pop()}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Legend by institution */}
              <div className="flex flex-wrap gap-3">
                {Array.from(
                  new Set(graph.nodes.map((n) => n.institution))
                ).map((inst, i) => {
                  const colors = [
                    "#2563eb",
                    "#7c3aed",
                    "#059669",
                    "#d97706",
                    "#dc2626",
                    "#0891b2",
                  ];
                  const group =
                    graph.nodes.find((n) => n.institution === inst)?.group ?? 0;
                  return (
                    <div key={inst} className="flex items-center gap-1.5">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{
                          backgroundColor: colors[group % colors.length],
                        }}
                      />
                      <span className="text-xs text-muted-foreground">
                        {inst}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <EmptyState
              title="No graph data"
              description="The collaboration graph will populate as you build connections."
            />
          )}
        </div>
      ) : /* Grid View */ !collaborators || collaborators.length === 0 ? (
        <EmptyState
          title="No collaborators found"
          description={
            search
              ? "Try adjusting your search terms."
              : "You have no collaborators yet. Explore researchers in your field to connect."
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {collaborators.map((c) => (
            <div
              key={c.id}
              className="rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-portal-accent-light text-sm font-semibold text-portal-accent">
                  {c.name
                    .split(" ")
                    .map((w) => w[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{c.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.department}, {c.institution}
                  </p>
                </div>
              </div>

              {/* Match Score */}
              <div className="mt-3 flex items-center gap-2">
                <p className="text-xs text-muted-foreground">Match:</p>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-portal-accent transition-all"
                    style={{ width: `${c.matchScore * 100}%` }}
                  />
                </div>
                <span className="text-xs font-medium">
                  {Math.round(c.matchScore * 100)}%
                </span>
              </div>

              {/* Stats */}
              <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                <span>{c.publicationCount} publications</span>
                <span>{c.sharedPublications} shared</span>
              </div>

              {/* Expertise */}
              {c.expertise.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {c.expertise.slice(0, 4).map((e) => (
                    <span
                      key={e}
                      className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"
                    >
                      {e}
                    </span>
                  ))}
                  {c.expertise.length > 4 && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                      +{c.expertise.length - 4}
                    </span>
                  )}
                </div>
              )}

              {/* Recent Work */}
              {c.recentWork.length > 0 && (
                <div className="mt-3 border-t border-border pt-3">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    Recent Work
                  </p>
                  <ul className="mt-1 space-y-1">
                    {c.recentWork.slice(0, 2).map((work, i) => (
                      <li
                        key={i}
                        className="truncate text-xs text-muted-foreground"
                      >
                        {work}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Contact */}
              <div className="mt-3 border-t border-border pt-3">
                <a
                  href={`mailto:${c.email}`}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-portal-accent hover:underline"
                >
                  <Mail className="h-3 w-3" />
                  {c.email}
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
