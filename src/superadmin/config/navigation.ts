import {
  LayoutDashboard,
  BookOpen,
  Radar,
  BadgeCheck,
  Briefcase,
  Sparkles,
  Scale,
  Settings,
  Users,
  UserCheck,
  GraduationCap,
  ClipboardList,
  FlaskConical,
  Search,
  BrainCircuit,
  UserPlus,
  Network,
  FileText,
  TrendingUp,
  BarChart3,
  ShieldCheck,
  ScrollText,
  UserCog,
  Link2,
  Wallet,
  Bot,
  FileBarChart,
  Building2,
  Landmark,
  Globe,
  GitCompare,
  Award,
  DollarSign,
  Activity,
  Trash2,
  Inbox,
  type LucideIcon,
} from "lucide-react";
import type { PortalRole } from "./portals";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

export const PORTAL_NAVIGATION: Record<PortalRole, NavSection[]> = {
  student: [
    {
      label: "Overview",
      items: [
        { label: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
        { label: "Academics", href: "/student/academics", icon: BookOpen },
      ],
    },
    {
      label: "Growth",
      items: [
        { label: "Skills & Development", href: "/student/skills", icon: Radar },
        { label: "Guided Learning", href: "/student/tutor", icon: BrainCircuit },
        { label: "Credentials", href: "/student/credentials", icon: BadgeCheck },
      ],
    },
    {
      label: "Career",
      items: [
        { label: "Placement & Jobs", href: "/student/placement", icon: Briefcase },
        { label: "AI Recommendations", href: "/student/recommendations", icon: Sparkles },
      ],
    },
    {
      label: "Account",
      items: [
        { label: "Appeals", href: "/student/appeals", icon: Scale },
        { label: "Settings", href: "/student/settings", icon: Settings },
      ],
    },
  ],

  faculty: [
    {
      label: "Overview",
      items: [
        { label: "Dashboard", href: "/faculty/dashboard", icon: LayoutDashboard },
        { label: "AI Briefings", href: "/faculty/briefings", icon: Sparkles },
      ],
    },
    {
      label: "Students",
      items: [
        { label: "My Students", href: "/faculty/students", icon: Users },
        { label: "Interventions", href: "/faculty/interventions", icon: UserCheck },
      ],
    },
    {
      label: "Teaching",
      items: [
        { label: "Courses", href: "/faculty/courses", icon: GraduationCap },
      ],
    },
    {
      label: "Research",
      items: [
        { label: "Overview", href: "/faculty/research", icon: FlaskConical },
        { label: "Grant Radar", href: "/faculty/research/grants", icon: Search },
        { label: "Collaborations", href: "/faculty/research/collaborations", icon: Network },
        { label: "Publications", href: "/faculty/research/publications", icon: FileText },
      ],
    },
    {
      label: "Account",
      items: [
        { label: "Settings", href: "/faculty/settings", icon: Settings },
      ],
    },
  ],

  admin: [
    {
      label: "Overview",
      items: [
        { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
        { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
      ],
    },
    {
      label: "Governance",
      items: [
        { label: "Compliance", href: "/admin/compliance", icon: ShieldCheck },
        { label: "Audit Trail", href: "/admin/compliance/audit-trail", icon: ScrollText },
      ],
    },
    {
      label: "Management",
      items: [
        { label: "Admissions", href: "/admin/admissions", icon: UserPlus },
        { label: "Users & Roles", href: "/admin/users", icon: UserCog },
        { label: "Integrations", href: "/admin/integrations", icon: Link2 },
        { label: "Budget & Resources", href: "/admin/budget", icon: Wallet },
      ],
    },
    {
      label: "Intelligence",
      items: [
        { label: "AI Governance", href: "/admin/ai-governance", icon: Bot },
        { label: "Credentials", href: "/admin/credentials", icon: BadgeCheck },
        { label: "Reports", href: "/admin/reports", icon: FileBarChart },
      ],
    },
    {
      label: "System",
      items: [
        { label: "Settings", href: "/admin/settings", icon: Settings },
      ],
    },
  ],

  research: [
    {
      label: "Overview",
      items: [
        { label: "Dashboard", href: "/research/dashboard", icon: LayoutDashboard },
        { label: "Performance", href: "/research/performance", icon: TrendingUp },
      ],
    },
    {
      label: "Funding",
      items: [
        { label: "Grant Discovery", href: "/research/grants", icon: Search },
        { label: "My Grants", href: "/research/grants/my-grants", icon: ClipboardList },
      ],
    },
    {
      label: "Network",
      items: [
        { label: "Collaborations", href: "/research/collaborations", icon: Network },
        { label: "Publications", href: "/research/publications", icon: FileText },
        { label: "Topic Trends", href: "/research/topics", icon: TrendingUp },
      ],
    },
    {
      label: "Account",
      items: [
        { label: "Settings", href: "/research/settings", icon: Settings },
      ],
    },
  ],

  placement: [
    {
      label: "Overview",
      items: [
        { label: "Dashboard", href: "/placement/dashboard", icon: LayoutDashboard },
      ],
    },
    {
      label: "Operations",
      items: [
        { label: "Students", href: "/placement/students", icon: GraduationCap },
        { label: "Employers", href: "/placement/employers", icon: Building2 },
        { label: "Matching Engine", href: "/placement/matching", icon: Sparkles },
        { label: "Pipeline", href: "/placement/pipeline", icon: GitCompare },
      ],
    },
    {
      label: "Insights",
      items: [
        { label: "Reports", href: "/placement/reports", icon: FileBarChart },
      ],
    },
    {
      label: "System",
      items: [
        { label: "Settings", href: "/placement/settings", icon: Settings },
      ],
    },
  ],

  ministry: [
    {
      label: "Overview",
      items: [
        { label: "Dashboard", href: "/ministry/dashboard", icon: LayoutDashboard },
        { label: "Institutions", href: "/ministry/institutions", icon: Landmark },
      ],
    },
    {
      label: "Oversight",
      items: [
        { label: "Compliance", href: "/ministry/compliance", icon: ShieldCheck },
        { label: "Quality Indicators", href: "/ministry/quality", icon: Award },
      ],
    },
    {
      label: "Strategic",
      items: [
        { label: "Policy Simulation", href: "/ministry/simulation", icon: Globe },
        { label: "Scenario Comparison", href: "/ministry/scenarios", icon: GitCompare },
        { label: "Budget Intelligence", href: "/ministry/budget", icon: DollarSign },
      ],
    },
    {
      label: "Reporting",
      items: [
        { label: "Reports", href: "/ministry/reports", icon: FileBarChart },
      ],
    },
    {
      label: "System",
      items: [
        { label: "Settings", href: "/ministry/settings", icon: Settings },
      ],
    },
  ],

  super_admin: [
    {
      label: "Overview",
      items: [
        { label: "Dashboard", href: "/superadmin/dashboard", icon: LayoutDashboard },
      ],
    },
    {
      label: "Tenants",
      items: [
        { label: "Universities", href: "/superadmin/universities", icon: Building2 },
        { label: "Trash", href: "/superadmin/trash", icon: Trash2 },
      ],
    },
    {
      label: "Operations",
      items: [
        { label: "Monitoring", href: "/superadmin/monitoring", icon: Activity },
        { label: "Complaints", href: "/superadmin/complaints", icon: Inbox },
        { label: "Audit Log", href: "/superadmin/audit-log", icon: ScrollText },
      ],
    },
    {
      label: "System",
      items: [{ label: "Settings", href: "/superadmin/settings", icon: Settings }],
    },
  ],
};
