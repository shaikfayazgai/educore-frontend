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
  Network,
  FileText,
  TrendingUp,
  BarChart3,
  ShieldCheck,
  ScrollText,
  UserCog,
  Bot,
  FileBarChart,
  Building2,
  Landmark,
  Globe,
  LineChart,
  GitCompare,
  Award,
  DollarSign,
  Calendar,
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
  super_admin: [
    {
      label: "Overview",
      items: [
        { label: "Dashboard", href: "/superadmin/dashboard", icon: LayoutDashboard },
      ],
    },
    {
      label: "Customers",
      items: [
        { label: "Universities", href: "/superadmin/universities", icon: Building2 },
      ],
    },
    {
      label: "Platform",
      items: [
        { label: "Monitoring", href: "/superadmin/monitoring", icon: BarChart3 },
        { label: "Audit Log", href: "/superadmin/audit-log", icon: ScrollText },
      ],
    },
    {
      label: "Account",
      items: [
        { label: "Settings", href: "/superadmin/settings", icon: Settings },
      ],
    },
  ],

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
        { label: "Users", href: "/admin/users", icon: UserCog },
        { label: "Programs & Degrees", href: "/admin/programs", icon: BookOpen },
        { label: "Academic Calendar", href: "/admin/semesters", icon: Calendar },
        { label: "Course Catalog", href: "/admin/courses", icon: GraduationCap },
      ],
    },
    {
      label: "Intelligence",
      items: [
        { label: "AI Governance", href: "/admin/ai-governance", icon: Bot },
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

};
