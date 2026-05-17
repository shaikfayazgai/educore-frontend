"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef } from "react";
import {
  GraduationCap, ArrowRight, CheckCircle2, BookOpen,
  Building2, Crown, Database, Brain,
  ShieldCheck, Network, Activity, Layers, Lock, ChevronRight,
} from "lucide-react";

// Placement portal hidden from landing — re-add the entry to restore it.
// Backend mount is also commented out in educore-merged/gateway/main.py.
const PORTALS = [
  { name: "Student",    icon: GraduationCap, desc: "Academics, AI tutor, skills evolution, credentials wallet, appeals, placement pipeline.", accent: "#7b5ee8", label: "Sapphire",    href: "/student/login" },
  { name: "Faculty",   icon: BookOpen,       desc: "Course briefings, student analytics, assessments, gradebook, intervention insights.",    accent: "#34d399", label: "Emerald",     href: "/faculty/login" },
  { name: "Admin",     icon: Building2,      desc: "Programs, semesters, users & roles, compliance audit, AI governance, university ops.",   accent: "#818cf8", label: "Deep Violet", href: "/admin/login" },
  { name: "Super Admin", icon: Crown,        desc: "Multi-university orchestration, audit log, monitoring, system-wide governance.",          accent: "#fbbf24", label: "Amber Gold",  href: "/superadmin/login" },
];

const INTEGRATIONS = ["Canvas LMS","Moodle","SIS","ERP","Scopus","HRMS","Banner","Workday","PowerSchool","Blackboard"];

const CAPABILITIES = [
  { icon: Brain,      title: "AI Agent Orchestration",  desc: "Seven domain agents — student development, placement intelligence, compliance, research optimization, institutional strategy, budget, and ministry intelligence — coordinated through a single planning layer." },
  { icon: Network,    title: "Multi-Tenant Architecture", desc: "Per-institution data isolation with ministry-grade oversight. PostgreSQL OLTP, Neo4j graph relationships, vector RAG, and time-series skills tracking — unified under one access model." },
  { icon: Layers,     title: "System of Connection",    desc: "Native connectors for Canvas, Moodle, SIS, ERP, Scopus, and HRMS. Glimmora doesn't replace your existing stack — it unifies it." },
  { icon: ShieldCheck,title: "Compliance by Default",   desc: "Built-in audit trails, bias reporting across every model in production, and continuous compliance pulse. Ready for regulator review on day one." },
  { icon: Activity,   title: "Predictive Intelligence", desc: "Risk scores, performance forecasts, and skills evolution surfaced in every dashboard — not buried in reports nobody opens." },
  { icon: Lock,       title: "Ministry-Grade Security", desc: "Role-scoped access, encrypted credentials, verifiable academic records, and a transparent audit log across every portal." },
];

const METRICS = [
  { value: "4",   label: "Connected portals" },
  { value: "58+", label: "Live workflows" },
  { value: "7",   label: "AI agents" },
  { value: "6+",  label: "External systems" },
];

const PRINCIPLES = [
  "Unifies fragmented academic, research, and placement systems into one operating layer.",
  "AI is woven into the data model — not bolted on as a chatbot.",
  "Designed for both individual universities and national ministries of education.",
  "Audit-ready, role-scoped, and built to a confidential classification standard.",
];

function scrollTo(id: string) {
  return (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };
}

// Splash screen removed per user request — the home page now renders the
// landing page directly. The old SplashScreen component file (_splash-screen.tsx)
// and the splash image (public/glimmora-winner.png) were also deleted.
export default function LandingPage() {
  const revealRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    revealRef.current = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("in-view")),
      { threshold: 0.08, rootMargin: "0px 0px -32px 0px" }
    );
    document.querySelectorAll(".sr").forEach((el) => revealRef.current?.observe(el));
    return () => revealRef.current?.disconnect();
  }, []);

  return (
    <div className="lp-root">
      {/* ── BACKGROUND (fixed so it never causes scroll gap) ── */}
      <div aria-hidden className="lp-bg">
        <div className="lp-glow" />
        <div className="lp-grid" />
        <div className="lp-fade" />
      </div>

      {/* ── NAV ── */}
      <header className="lp-nav-wrap">
        <nav className="lp-nav">
          <Link href="/" className="lp-logo" aria-label="Glimmora Educore — home">
            {/* Horizontal wordmark replaces the old GraduationCap + "Glimmora"
                text combo. Image is white-background — wrap it in a soft
                rounded white card so it reads cleanly against the dark
                #050416 landing-page background. */}
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "4px 10px",
                background: "#fff",
                borderRadius: "8px",
              }}
            >
              <Image
                src="/glimmora-logo.png"
                alt="Glimmora Educore"
                width={140}
                height={32}
                priority
                style={{ height: "32px", width: "auto", display: "block" }}
              />
            </span>
          </Link>

          <div className="lp-nav-links">
            <a href="#platform"      onClick={scrollTo("platform")}>Platform</a>
            <a href="#portals"       onClick={scrollTo("portals")}>Portals</a>
            <a href="#capabilities"  onClick={scrollTo("capabilities")}>Capabilities</a>
            <a href="#architecture"  onClick={scrollTo("architecture")}>Architecture</a>
          </div>

          <div className="lp-nav-actions">
            <button onClick={scrollTo("portals")} className="lp-cta-pill">
              Launch demo <ArrowRight size={14} />
            </button>
          </div>
        </nav>
      </header>

      {/* ── HERO ── */}
      <section id="platform" className="lp-hero">
        <div className="lp-hero-inner">
          <div className="lp-badge lp-r lp-r1">
            <span className="lp-tick" />
            Multi-tenant · AI-native · Classification: Confidential
          </div>

          <h1 className="lp-h1 lp-r lp-r2">
            Education Intelligence<br />
            <span className="lp-h1-dim">Infrastructure.</span>
          </h1>

          <p className="lp-sub lp-r lp-r3">
            One AI-native platform unifying student development, faculty operations,
            placement, compliance, and institutional strategy — across universities,
            research institutions, and ministries.
          </p>

          <div className="lp-hero-btns lp-r lp-r4">
            <button onClick={scrollTo("portals")} className="lp-btn-primary">
              Launch the demo <ArrowRight size={15} />
            </button>
            <a href="#capabilities" onClick={scrollTo("capabilities")} className="lp-btn-ghost">
              Explore the platform
            </a>
          </div>

          <div className="lp-trust lp-r lp-r5">
            {["No card required","Instant role-switch demo","Real workflows, real data"].map((t) => (
              <span key={t}><CheckCircle2 size={13} />{t}</span>
            ))}
          </div>

          <div className="lp-rule lp-r lp-r6" />

          <div className="lp-metrics lp-r lp-r6">
            {METRICS.map((m) => (
              <div key={m.label} className="lp-metric">
                <div className="lp-metric-val">{m.value}</div>
                <div className="lp-metric-lbl">{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── INTEGRATIONS ── */}
      <section className="lp-integ">
        <p className="lp-section-eyebrow">Connects to the systems your institution already runs</p>
        <div className="lp-marquee-wrap">
          <div className="lp-marquee">
            {[...INTEGRATIONS,...INTEGRATIONS].map((n, i) => (
              <div key={i} className="lp-integ-item"><Database size={14} />{n}</div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PORTALS ── */}
      <section id="portals" className="lp-section">
        <div className="lp-container">
          <div className="sr lp-section-head">
            <div className="lp-section-eyebrow">Four portals · one shared data spine</div>
            <h2 className="lp-h2">Purpose-built for every role</h2>
            <p className="lp-section-desc">
              Each portal is designed for its audience — yet every workflow flows
              through a single data spine. Switch roles in one click.
            </p>
          </div>

          <div className="lp-grid-cards lp-portals-grid">
            {PORTALS.map((p, idx) => {
              const Icon = p.icon;
              return (
                <div
                  key={p.name}
                  className={`sr lp-card lp-portal-card${idx === PORTALS.length - 1 ? " lp-card-wide" : ""}`}
                  style={{ "--accent": p.accent, transitionDelay: `${idx * 55}ms` } as React.CSSProperties}
                >
                  <div className="lp-card-topline" />
                  <div className="lp-card-glow" />
                  <div className="lp-card-header">
                    <div className="lp-portal-icon"><Icon size={18} /></div>
                    <span className="lp-portal-label">{p.label}</span>
                  </div>
                  <h3 className="lp-card-title">{p.name} Portal</h3>
                  <p className="lp-card-desc">{p.desc}</p>
                  <Link href={p.href} className="lp-card-link">
                    Open portal <ChevronRight size={13} />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CAPABILITIES ── */}
      <section id="capabilities" className="lp-section">
        <div className="lp-container">
          <div className="sr lp-section-head">
            <div className="lp-section-eyebrow">The platform layer</div>
            <h2 className="lp-h2">Built like infrastructure, not a feature</h2>
            <p className="lp-section-desc">
              Glimmora is the connective tissue between your LMS, SIS, ERP, and
              research databases — with AI woven into every layer.
            </p>
          </div>

          <div className="lp-grid-cards">
            {CAPABILITIES.map((c, idx) => {
              const Icon = c.icon;
              return (
                <div
                  key={c.title}
                  className="sr lp-card lp-cap-card"
                  style={{ transitionDelay: `${idx * 45}ms` } as React.CSSProperties}
                >
                  <div className="lp-cap-icon"><Icon size={18} /></div>
                  <h3 className="lp-card-title lp-cap-title">{c.title}</h3>
                  <p className="lp-card-desc">{c.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── ARCHITECTURE ── */}
      <section id="architecture" className="lp-section">
        <div className="lp-container">
          <div className="lp-arch-grid">
            <div className="sr lp-arch-left">
              <div className="lp-section-eyebrow">Design principles</div>
              <h2 className="lp-h2">Designed for the next decade of higher education</h2>
              <p className="lp-section-desc" style={{ marginTop: "1.25rem" }}>
                Glimmora is built on the assumption that universities will spend the
                next ten years consolidating fragmented academic systems and adopting
                AI across every operational surface.
              </p>
            </div>
            <ul className="lp-principles">
              {PRINCIPLES.map((p, i) => (
                <li key={p} className="sr lp-principle" style={{ transitionDelay: `${i * 65}ms` }}>
                  <span className="lp-principle-num">{String(i + 1).padStart(2, "0")}</span>
                  <p>{p}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="lp-section">
        <div className="lp-container">
          <div className="sr lp-cta-box">
            <div className="lp-cta-glow" />
            <div className="lp-cta-inner">
              <div className="lp-badge" style={{ marginBottom: "1rem" }}>
                <span className="lp-tick" />Live demo available
              </div>
              <h2 className="lp-h2">See Glimmora across every portal</h2>
              <p className="lp-section-desc" style={{ marginTop: "1rem" }}>
                Switch between Student, Faculty, Admin, and Super Admin in
                one click. Real workflows. Real intelligence. Zero setup.
              </p>
              <div className="lp-hero-btns" style={{ marginTop: "2rem", justifyContent: "center" }}>
                <button onClick={scrollTo("portals")} className="lp-btn-primary">
                  Launch the demo <ArrowRight size={15} />
                </button>
                <button onClick={scrollTo("portals")} className="lp-btn-ghost">
                  Choose your portal
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-logo">
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "3px 8px",
                background: "#fff",
                borderRadius: "6px",
              }}
            >
              <Image
                src="/glimmora-logo.png"
                alt="Glimmora Educore"
                width={120}
                height={28}
                style={{ height: "26px", width: "auto", display: "block" }}
              />
            </span>
            <div className="lp-logo-sub" style={{ marginLeft: "0.5rem" }}>
              Education Intelligence Infrastructure
            </div>
          </div>
          <div className="lp-footer-links">
            <a href="#platform"     onClick={scrollTo("platform")}>Platform</a>
            <a href="#portals"      onClick={scrollTo("portals")}>Portals</a>
            <a href="#capabilities" onClick={scrollTo("capabilities")}>Capabilities</a>
            <a href="#architecture" onClick={scrollTo("architecture")}>Architecture</a>
          </div>
          <div className="lp-copyright">&copy; {new Date().getFullYear()} Glimmora. Confidential.</div>
        </div>
      </footer>
    </div>
  );
}
