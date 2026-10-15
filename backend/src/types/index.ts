export interface UserProfile {
  tech_stack: string[];
  interests: string;
  skill_level: string;
  open_source_experience: string;
}

export interface Persona {
  stack: string[];
  level: string;
  interests: string;
  experience: string;
  extracted_keywords: string[];
}

export interface GitHubLabel { name?: string }

export interface GitHubIssue {
  title?: string;
  html_url?: string;
  number?: number;
  state?: string;
  labels?: GitHubLabel[];
  pull_request?: unknown;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  stargazers_count: number;
  description?: string | null;
  language?: string | null;
  topics?: string[];
  archived?: boolean;
  private?: boolean;
  updated_at?: string;
  owner: { login: string };
}
