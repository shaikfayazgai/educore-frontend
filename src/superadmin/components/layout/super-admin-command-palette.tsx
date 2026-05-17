"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  Archive,
  Bell,
  Building2,
  CheckCircle2,
  Clock3,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Filter,
  Globe,
  KeyRound,
  LayoutDashboard,
  Mail,
  MailCheck,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  Server,
  Settings,
  Settings2,
  ShieldBan,
  ShieldCheck,
  Trash2,
  Upload,
  User,
  UserCog,
  X,
  type LucideIcon,
} from "lucide-react";
import { useUiStore } from "@/superadmin/lib/stores/ui-store";
import { cn } from "@/superadmin/lib/utils/cn";

type SearchItem = {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  group: "Page" | "Feature" | "Setting" | "Action" | "Filter";
  keywords: string;
  priority?: number;
};

const SEARCH_ITEMS: SearchItem[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    description: "Platform summary and tenant counts",
    href: "/superadmin/dashboard",
    icon: LayoutDashboard,
    group: "Page",
    keywords: "home overview metrics total universities active suspended pending deletion university growth quick access recent onboardings active rate",
    priority: 90,
  },
  {
    id: "dashboard-growth",
    title: "University Growth",
    description: "Open dashboard growth trends and recent onboarding metrics",
    href: "/superadmin/dashboard",
    icon: Activity,
    group: "Feature",
    keywords: "growth trend chart onboardings recent tenants active rate suspended total students faculty users",
  },
  {
    id: "dashboard-quick-access",
    title: "Quick Access",
    description: "Open dashboard shortcuts for super-admin workflows",
    href: "/superadmin/dashboard",
    icon: Settings2,
    group: "Feature",
    keywords: "shortcuts cards dashboard navigation create university settings audit monitoring trash complaints",
  },
  {
    id: "universities",
    title: "Universities",
    description: "Find, create, suspend, and manage tenants",
    href: "/superadmin/universities",
    icon: Building2,
    group: "Page",
    keywords: "institutions tenants colleges admins university list search status active inactive suspended domain code city country state",
    priority: 88,
  },
  {
    id: "universities-search",
    title: "Search Universities",
    description: "Search tenants by name, admin, domain, code, or location",
    href: "/superadmin/universities",
    icon: Search,
    group: "Feature",
    keywords: "find filter university tenant name short name admin email domain university code city country state status",
  },
  {
    id: "create-university",
    title: "Create University",
    description: "Add a new tenant and administrator account",
    href: "/superadmin/universities",
    icon: Plus,
    group: "Action",
    keywords: "add institution tenant college university name short name code type domain country state pin admin email phone designation temporary password invite",
    priority: 70,
  },
  {
    id: "import-universities",
    title: "Import Universities",
    description: "Bulk upload universities from CSV or spreadsheet files",
    href: "/superadmin/universities",
    icon: Upload,
    group: "Action",
    keywords: "bulk upload csv xlsx spreadsheet dry run validate import tenants institutions colleges",
  },
  {
    id: "university-details",
    title: "University Details",
    description: "View tenant profile, stats, admin information, and support actions",
    href: "/superadmin/universities",
    icon: Eye,
    group: "Feature",
    keywords: "view details profile total users students faculty university information admin email admin name verified unverified",
  },
  {
    id: "edit-university",
    title: "Edit University",
    description: "Update tenant details, administrator fields, and status",
    href: "/superadmin/universities",
    icon: Pencil,
    group: "Action",
    keywords: "edit update university name code type domain country state city pin admin email phone designation status",
  },
  {
    id: "activate-university",
    title: "Activate University",
    description: "Restore access for an inactive tenant",
    href: "/superadmin/universities",
    icon: ShieldCheck,
    group: "Action",
    keywords: "activate reactivate active inactive restore access tenant university status",
  },
  {
    id: "suspend-university",
    title: "Suspend University",
    description: "Block tenant access with a suspension reason",
    href: "/superadmin/universities",
    icon: ShieldBan,
    group: "Action",
    keywords: "suspend suspension suspended block deactivate deactivate tenant access reason comment complaint lockout",
  },
  {
    id: "reset-admin-password",
    title: "Reset Admin Password",
    description: "Send a password reset email to a university administrator",
    href: "/superadmin/universities",
    icon: KeyRound,
    group: "Action",
    keywords: "password reset admin administrator university email support action set new password",
  },
  {
    id: "send-invitation-otp",
    title: "Send Invitation OTP",
    description: "Send or resend the tenant admin verification code",
    href: "/superadmin/universities",
    icon: Send,
    group: "Action",
    keywords: "otp invitation invite resend send verify verification admin email code expires",
  },
  {
    id: "verify-invitation",
    title: "Verify Invitation",
    description: "Confirm an admin email using the invitation OTP",
    href: "/superadmin/universities",
    icon: MailCheck,
    group: "Action",
    keywords: "verify invitation otp admin email verified unverified re verify code",
  },
  {
    id: "complaints",
    title: "Complaints",
    description: "Review lockout and tenant access requests",
    href: "/superadmin/complaints",
    icon: Bell,
    group: "Page",
    keywords: "queries support lockout suspended deactivated contact requests tenant complaints issue access blocked inactive trashed",
    priority: 84,
  },
  {
    id: "complaints-search",
    title: "Search Complaints",
    description: "Search by name, email, university, or complaint text",
    href: "/superadmin/complaints",
    icon: Search,
    group: "Feature",
    keywords: "complaint search name email university text message tenant access lockout request",
  },
  {
    id: "complaint-filters",
    title: "Complaint Filters",
    description: "Filter requests by status and issue type",
    href: "/superadmin/complaints",
    icon: Filter,
    group: "Filter",
    keywords: "status issue type open in progress resolved dismissed suspended inactive trashed problem filter",
  },
  {
    id: "resolve-complaint",
    title: "Resolve Complaint",
    description: "Add an internal resolution note and update request status",
    href: "/superadmin/complaints",
    icon: CheckCircle2,
    group: "Action",
    keywords: "resolve close complaint status resolution note handled staff internal note",
  },
  {
    id: "monitoring",
    title: "Monitoring",
    description: "Service health and audit-derived trends",
    href: "/superadmin/monitoring",
    icon: Activity,
    group: "Page",
    keywords: "health performance status uptime api response time errors error rate service health active tenants audit derived trends",
    priority: 82,
  },
  {
    id: "service-health",
    title: "Service Health",
    description: "Review API status, response time, and errors",
    href: "/superadmin/monitoring",
    icon: Server,
    group: "Feature",
    keywords: "service health api response time uptime errors error rate monitoring performance latency status",
  },
  {
    id: "audit-log",
    title: "Audit Log",
    description: "Search platform activity and security events",
    href: "/superadmin/audit-log",
    icon: FileText,
    group: "Page",
    keywords: "logs history failed login security activity actor target details actions audit trail events",
    priority: 80,
  },
  {
    id: "audit-log-search",
    title: "Search Audit Log",
    description: "Search audit entries by actor, target, or details",
    href: "/superadmin/audit-log",
    icon: Search,
    group: "Feature",
    keywords: "audit search actor target details activity history logs login failed security event",
  },
  {
    id: "audit-action-filter",
    title: "Audit Action Filter",
    description: "Filter audit entries by action type",
    href: "/superadmin/audit-log",
    icon: Filter,
    group: "Filter",
    keywords: "all actions created university suspended reactivated trash restored exported deleted login logout update settings block ip",
  },
  {
    id: "export-audit-log",
    title: "Export Audit Log",
    description: "Download audit entries as CSV or Excel",
    href: "/superadmin/audit-log",
    icon: Download,
    group: "Action",
    keywords: "download export audit log csv xlsx excel spreadsheet filtered entries",
  },
  {
    id: "audit-maintenance",
    title: "Audit Maintenance",
    description: "Auto-purge old entries or manually clean audit records",
    href: "/superadmin/audit-log",
    icon: Settings2,
    group: "Feature",
    keywords: "maintenance auto purge old entries retention days manual cleanup delete audit records bulk delete",
  },
  {
    id: "audit-retention",
    title: "Audit Retention",
    description: "Set how long audit records are kept before purge",
    href: "/superadmin/audit-log",
    icon: Clock3,
    group: "Setting",
    keywords: "retention days auto delete auto purge old audit entries 30 60 90 180 365",
  },
  {
    id: "trash",
    title: "Trash",
    description: "Restore or permanently delete tenants",
    href: "/superadmin/trash",
    icon: Trash2,
    group: "Page",
    keywords: "deleted removed restore purge archive permanent delete tenants universities trash retention export extend",
    priority: 78,
  },
  {
    id: "trash-search",
    title: "Search Trash",
    description: "Find deleted tenants before the retention window ends",
    href: "/superadmin/trash",
    icon: Search,
    group: "Feature",
    keywords: "trash search deleted tenant university name code admin retention permanent delete days left",
  },
  {
    id: "restore-tenant",
    title: "Restore Tenant",
    description: "Move a deleted university back to the active tenant list",
    href: "/superadmin/trash",
    icon: RotateCcw,
    group: "Action",
    keywords: "restore recover tenant university trash active undelete reactivate",
  },
  {
    id: "export-trashed-tenant",
    title: "Export Trashed Tenant",
    description: "Download tenant data before permanent deletion",
    href: "/superadmin/trash",
    icon: FileSpreadsheet,
    group: "Action",
    keywords: "export download tenant data trash json backup deleted university",
  },
  {
    id: "delete-permanently",
    title: "Delete Permanently",
    description: "Permanently remove a tenant from Trash",
    href: "/superadmin/trash",
    icon: Trash2,
    group: "Action",
    keywords: "permanent delete purge remove tenant trash destructive retention window",
  },
  {
    id: "extend-trash-window",
    title: "Extend Trash Window",
    description: "Change the permanent deletion date for a trashed tenant",
    href: "/superadmin/trash",
    icon: Clock3,
    group: "Action",
    keywords: "extend shorten retention window permanent delete date days trash tenant",
  },
  {
    id: "profile-settings",
    title: "Profile",
    description: "View super-admin account identity and read-only personal details",
    href: "/superadmin/settings?tab=profile#profile-overview",
    icon: User,
    group: "Setting",
    keywords: "profile account personal information full name email address role user menu my account",
    priority: 74,
  },
  {
    id: "personal-information",
    title: "Personal Information",
    description: "View your name and email address",
    href: "/superadmin/settings?tab=profile#personal-information",
    icon: UserCog,
    group: "Setting",
    keywords: "personal information full name email address read only account profile user",
  },
  {
    id: "change-password",
    title: "Change Password",
    description: "Update the current super-admin password",
    href: "/superadmin/settings?tab=profile#current-password",
    icon: KeyRound,
    group: "Setting",
    keywords: "password current password new password confirm password update password change password profile security credentials account",
    priority: 95,
  },
  {
    id: "current-password",
    title: "Current Password",
    description: "Open the profile security field for your existing password",
    href: "/superadmin/settings?tab=profile#current-password",
    icon: KeyRound,
    group: "Setting",
    keywords: "current password old password existing password profile security change password credentials",
    priority: 100,
  },
  {
    id: "new-password",
    title: "New Password",
    description: "Open the profile field for the replacement password",
    href: "/superadmin/settings?tab=profile#new-password",
    icon: KeyRound,
    group: "Setting",
    keywords: "new password replacement password at least 8 characters profile security update password",
    priority: 96,
  },
  {
    id: "confirm-password",
    title: "Confirm Password",
    description: "Open the profile field to re-enter the new password",
    href: "/superadmin/settings?tab=profile#confirm-password",
    icon: KeyRound,
    group: "Setting",
    keywords: "confirm password re enter new password confirmation profile security update password",
    priority: 94,
  },
  {
    id: "platform-settings",
    title: "Platform Settings",
    description: "General settings, webhook, and feature flags",
    href: "/superadmin/settings?tab=platform#platform-general",
    icon: Settings,
    group: "Setting",
    keywords: "slack webhook email limits timezone platform name support email data retention max universities max users feature flags",
    priority: 76,
  },
  {
    id: "platform-general",
    title: "Platform General",
    description: "Edit platform name, support email, timezone, and retention",
    href: "/superadmin/settings?tab=platform#platform-general",
    icon: Globe,
    group: "Setting",
    keywords: "platform name support email default timezone data retention years asia kolkata ist",
  },
  {
    id: "platform-limits",
    title: "Platform Limits",
    description: "Set max universities and max users per university",
    href: "/superadmin/settings?tab=platform#platform-limits",
    icon: Settings2,
    group: "Setting",
    keywords: "limits max universities max users per university capacity constraints tenant caps",
  },
  {
    id: "feature-flags",
    title: "Feature Flags",
    description: "Toggle maintenance mode, registrations, and email notifications",
    href: "/superadmin/settings?tab=platform#feature-flags",
    icon: Settings2,
    group: "Setting",
    keywords: "feature flags maintenance mode allow new registrations email notifications on off toggle platform features",
  },
  {
    id: "maintenance-mode",
    title: "Maintenance Mode",
    description: "Show a maintenance page to all users",
    href: "/superadmin/settings?tab=platform#feature-flags",
    icon: Settings2,
    group: "Setting",
    keywords: "maintenance mode all users maintenance page disable access feature flag",
  },
  {
    id: "allow-new-registrations",
    title: "Allow New Registrations",
    description: "Control whether new accounts can be created",
    href: "/superadmin/settings?tab=platform#feature-flags",
    icon: UserCog,
    group: "Setting",
    keywords: "allow new registrations accounts create signup sign up disabled feature flag",
  },
  {
    id: "email-notifications",
    title: "Email Notifications",
    description: "Control informational email notifications for account events",
    href: "/superadmin/settings?tab=platform#feature-flags",
    icon: Mail,
    group: "Setting",
    keywords: "email notifications account events tenant created suspended trashed restored security critical otp password setup reset change verification welcome credentials",
  },
  {
    id: "slack-webhook",
    title: "Slack Webhook URL",
    description: "Configure and test the external Slack webhook integration",
    href: "/superadmin/settings?tab=platform#slack-webhook-url",
    icon: RefreshCw,
    group: "Setting",
    keywords: "slack webhook url integrations test webhook external service hooks slack services payload latency",
  },
  {
    id: "email-templates",
    title: "Email Templates",
    description: "Edit platform email templates",
    href: "/superadmin/settings?tab=emails#email-templates",
    icon: Archive,
    group: "Setting",
    keywords: "mail template suspension welcome onboarding password reset account reactivation subject body variables admin name email university temp password reset url",
    priority: 70,
  },
  {
    id: "welcome-email-template",
    title: "Welcome / Onboarding Email",
    description: "Edit the tenant creation welcome email",
    href: "/superadmin/settings?tab=emails#email-templates",
    icon: Mail,
    group: "Setting",
    keywords: "welcome onboarding email template login url admin email temporary password temp password change password first login",
  },
  {
    id: "password-reset-email-template",
    title: "Password Reset Email",
    description: "Edit the password reset email template",
    href: "/superadmin/settings?tab=emails#email-templates",
    icon: KeyRound,
    group: "Setting",
    keywords: "password reset email template reset url expires set new password forgot password",
  },
  {
    id: "suspension-email-template",
    title: "Suspension Email",
    description: "Edit the account suspension notice",
    href: "/superadmin/settings?tab=emails#email-templates",
    icon: ShieldBan,
    group: "Setting",
    keywords: "suspension suspended account tenant email template all users lose access contact support",
  },
  {
    id: "reactivation-email-template",
    title: "Reactivation Email",
    description: "Edit the account reactivation notice",
    href: "/superadmin/settings?tab=emails#email-templates",
    icon: ShieldCheck,
    group: "Setting",
    keywords: "reactivation reactivated account tenant email template restore access users can access",
  },
];

function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .replace(/[-_/]+/g, " ")
    .replace(/[^\w\s@.#]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildSearchText(item: SearchItem) {
  return normalizeSearchText(
    `${item.title} ${item.description} ${item.group} ${item.keywords} ${item.href}`,
  );
}

function getSearchScore(item: SearchItem, query: string) {
  const needle = normalizeSearchText(query);
  if (!needle) return item.priority ?? 0;

  const title = normalizeSearchText(item.title);
  const description = normalizeSearchText(item.description);
  const group = normalizeSearchText(item.group);
  const keywords = normalizeSearchText(item.keywords);
  const href = normalizeSearchText(item.href);
  const haystack = `${title} ${description} ${group} ${keywords} ${href}`;
  const tokens = needle.split(" ").filter(Boolean);

  const phraseMatches =
    title.includes(needle) ||
    description.includes(needle) ||
    group.includes(needle) ||
    keywords.includes(needle) ||
    href.includes(needle);
  const tokenMatches = tokens.every((token) => haystack.includes(token));

  if (!phraseMatches && !tokenMatches) return -1;

  let score = item.priority ?? 0;
  if (title === needle) score += 140;
  else if (title.startsWith(needle)) score += 110;
  else if (title.includes(needle)) score += 85;
  if (description.includes(needle)) score += 45;
  if (group.includes(needle)) score += 25;
  if (keywords.includes(needle)) score += 35;
  if (href.includes(needle)) score += 10;
  score += tokens.filter((token) => title.includes(token)).length * 18;
  score += tokens.filter((token) => keywords.includes(token)).length * 8;
  return score;
}

function HighlightedTitle({ text, query }: { text: string; query: string }) {
  const needle = query.trim();
  if (!needle) return <>{text}</>;

  const index = text.toLowerCase().indexOf(needle.toLowerCase());
  if (index === -1) return <>{text}</>;

  return (
    <>
      {text.slice(0, index)}
      <mark className="rounded bg-primary-100 px-0.5 text-primary-800">
        {text.slice(index, index + needle.length)}
      </mark>
      {text.slice(index + needle.length)}
    </>
  );
}

export function SuperAdminCommandPalette() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const { commandPaletteOpen, setCommandPaletteOpen } = useUiStore();
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isSearchShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
      if (isSearchShortcut) {
        event.preventDefault();
        setHighlightedIndex(0);
        setCommandPaletteOpen(true);
      }
      if (event.key === "Escape") {
        setQuery("");
        setCommandPaletteOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setCommandPaletteOpen]);

  useEffect(() => {
    if (!commandPaletteOpen) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [commandPaletteOpen]);

  const results = useMemo(() => {
    const needle = query.trim();
    if (!needle) return SEARCH_ITEMS;
    return SEARCH_ITEMS
      .map((item) => ({ item, score: getSearchScore(item, needle) }))
      .filter((result) => result.score >= 0)
      .sort((a, b) => b.score - a.score || buildSearchText(a.item).localeCompare(buildSearchText(b.item)))
      .map((result) => result.item);
  }, [query]);

  const activeIndex = results.length === 0 ? 0 : Math.min(highlightedIndex, results.length - 1);

  const openCommand = (href: string) => {
    setQuery("");
    setHighlightedIndex(0);
    setCommandPaletteOpen(false);
    router.push(href);
  };

  const closePalette = () => {
    setQuery("");
    setHighlightedIndex(0);
    setCommandPaletteOpen(false);
  };

  const handleInputKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (results.length === 0) return;
      setHighlightedIndex((index) => Math.min(index + 1, results.length - 1));
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (results.length === 0) return;
      setHighlightedIndex((index) => Math.max(index - 1, 0));
    }
    if (event.key === "Enter" && results[activeIndex]) {
      event.preventDefault();
      openCommand(results[activeIndex].href);
    }
  };

  if (!commandPaletteOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] bg-background/60 p-4 backdrop-blur-sm sm:p-6">
      <button
        aria-label="Close search"
        className="absolute inset-0 cursor-default"
        onClick={closePalette}
      />
      <div className="relative mx-auto mt-16 w-full max-w-2xl overflow-hidden rounded-lg border border-border bg-card shadow-2xl">
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setHighlightedIndex(0);
            }}
            onKeyDown={handleInputKeyDown}
            placeholder="Search pages, features, settings, fields..."
            className="h-9 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            aria-label="Search super-admin pages, features, settings, and fields"
            aria-activedescendant={results[activeIndex]?.id}
          />
          <button
            onClick={closePalette}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[460px] overflow-y-auto p-2" role="listbox" aria-label="Super-admin search results">
          {results.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <Search className="mx-auto h-7 w-7 text-muted-foreground/40" />
              <p className="mt-2 text-sm font-medium">No results found</p>
              <p className="mt-1 text-xs text-muted-foreground">Try password, webhook, block IP, export, audit, or university.</p>
            </div>
          ) : (
            results.map((item, index) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  id={item.id}
                  role="option"
                  aria-selected={activeIndex === index}
                  onClick={() => openCommand(item.href)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-muted",
                    activeIndex === index && "bg-muted/70",
                  )}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="block truncate text-sm font-semibold text-foreground">
                        <HighlightedTitle text={item.title} query={query} />
                      </span>
                      <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {item.group}
                      </span>
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">{item.description}</span>
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
