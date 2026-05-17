import type { Identifiable, Timestamps, GrantStatus } from "./common.types";

// === Dashboard ===
export interface ResearchDashboard {
  publications: { total: number; thisYear: number; trend: number };
  grants: { active: number; totalFunding: number; pendingProposals: number };
  collaborations: { active: number; pending: number };
  trendingTopics: TrendingTopic[];
  hIndex: number;
  citations: number;
  recentPublications: ResearchPublication[];
}

// === Grants ===
export interface ResearchGrant extends Identifiable, Timestamps {
  title: string;
  fundingBody: string;
  amount: number;
  currency: string;
  alignmentScore: number;
  successProbability: number;
  deadline: string;
  topics: string[];
  status: GrantStatus;
  matchExplanation: string;
  requirements: string[];
  description: string;
  eligibility: string;
  url?: string;
}

export interface MyGrant extends Identifiable, Timestamps {
  title: string;
  fundingBody: string;
  amount: number;
  currency: string;
  status: "drafting" | "submitted" | "under_review" | "funded" | "rejected";
  submittedDate?: string;
  responseDate?: string;
  topics: string[];
  feedback?: string;
}

// === Collaborations ===
export interface Collaborator extends Identifiable {
  name: string;
  institution: string;
  department: string;
  expertise: string[];
  publicationCount: number;
  sharedPublications: number;
  matchScore: number;
  email: string;
  avatarUrl: string | null;
  bio?: string;
  recentWork: string[];
}

export interface CollaborationGraph {
  nodes: { id: string; name: string; institution: string; group: number }[];
  edges: { source: string; target: string; strength: number; sharedPubs: number }[];
}

// === Publications ===
export interface ResearchPublication extends Identifiable {
  title: string;
  journal: string;
  year: number;
  citations: number;
  coAuthors: string[];
  doi?: string;
  type: "journal" | "conference" | "book_chapter" | "preprint";
  status: "published" | "in_review" | "accepted" | "preprint";
  abstract?: string;
}

// === Topics ===
export interface TrendingTopic {
  topic: string;
  momentum: number;
  fundingGrowth: number;
  publicationCount: number;
  relatedGrants: number;
  relatedTopics: string[];
}

export interface TopicAnalytics {
  topics: TrendingTopic[];
  trendOverTime: { month: string; [topic: string]: string | number }[];
}

// === Performance ===
export interface ResearchPerformance {
  publicationMetrics: {
    total: number;
    thisYear: number;
    avgCitationsPerPaper: number;
    hIndex: number;
    i10Index: number;
  };
  outputByYear: { year: number; publications: number; citations: number }[];
  impactByType: { type: string; count: number; avgCitations: number }[];
  growthProjection: { year: number; projected: number; lower: number; upper: number }[];
  peerComparison: { metric: string; you: number; fieldAvg: number; top10: number }[];
}

// === Settings ===
export interface ResearchProfile {
  name: string;
  email: string;
  researcherId: string;
  department: string;
  title: string;
  institution: string;
  phone?: string;
  bio?: string;
  avatarUrl?: string | null;
  researchInterests: string[];
  expertise: string[];
  orcid?: string;
  googleScholar?: string;
  socialLinks: { platform: string; url: string }[];
}
