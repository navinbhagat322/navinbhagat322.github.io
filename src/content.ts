export const profile = {
  name: "Navin Kumar",
  handle: "navin",
  host: "terno",
  role: "AI Engineer",
  company: "TernoAI",
  location: "India",
  tagline: "I build the layer between AI agents and real company data — MCP servers, connectors, and text-to-SQL that's safe to run in production.",
  education: "B.Tech, IIT Jodhpur",
  focus: ["LLM agents", "MCP", "text-to-SQL", "RAG", "evals"],
  offline: ["film-making", "photography", "fitness", "meditation"],
};

export const stats = [
  { value: "280+", label: "commits to TernoDBI", hint: "top contributor" },
  { value: "9+", label: "API connectors shipped", hint: "GA4 → Shopify" },
  { value: "1.0.35", label: "TernoDBI on PyPI", hint: "pip install terno-dbi" },
];

export const links = {
  github: "https://github.com/navinbhagat322",
  linkedin: "https://www.linkedin.com/in/navin322/",
  email: "navinbhagat322@gmail.com",
  youtube: "https://www.youtube.com/@Navin_bhagat",
  instagram: "https://www.instagram.com/navin.bhagat_/",
};

export interface Project {
  slug: string;
  name: string;
  kind: "work" | "open-source" | "personal";
  year: number;
  stack: string[];
  summary: string;
  highlights?: string[];
  url?: string;
  featured?: boolean;
}

export const projects: Project[] = [
  {
    slug: "ternodbi",
    name: "TernoDBI",
    kind: "open-source",
    year: 2026,
    stack: ["Python", "Django", "MCP", "OAuth", "SQL"],
    summary:
      "Database intelligence layer for AI agents. Agents connect over MCP and every query is validated, scoped to the caller and explained.",
    highlights: [
      "Top contributor — 280+ commits, from CLI to hosted MCP server",
      "Hosted MCP server with OAuth + dynamic client registration (works with Claude, Cursor, ChatGPT)",
      "API connectors: GA4, Google Ads, Meta Ads, YouTube, Search Console, HubSpot, Shopify, Instagram",
      "Multi-tenancy, scoped service tokens, encrypted credentials, org memory",
      "Streaming queries with dialect-aware pagination; example agents for LangChain, OpenAI Agents SDK, AutoGen",
    ],
    url: "https://github.com/terno-ai/ternodbi",
    featured: true,
  },
  {
    slug: "sqlshield",
    name: "SQLShield",
    kind: "open-source",
    year: 2025,
    stack: ["Python", "sqlglot", "Snowflake"],
    summary:
      "A shield between LLM-generated SQL and your database: limits tables, columns and rows, and rewrites queries before they run.",
    highlights: [
      "Snowflake support, including its case-sensitivity rules",
      "Cross-platform wheel builds for macOS and Windows",
    ],
    url: "https://pypi.org/project/sqlshield/",
    featured: true,
  },
  {
    slug: "terno-agent",
    name: "Terno Agent",
    kind: "work",
    year: 2026,
    stack: ["Python", "LLMs", "Agents"],
    summary:
      "TernoAI's data-science agent. I worked on its prompts, org memory, plan mode and notebook-style reports.",
    url: "https://github.com/terno-ai/terno-agent",
    featured: true,
  },
  {
    slug: "terno-web",
    name: "Terno platform",
    kind: "work",
    year: 2026,
    stack: ["Django", "OAuth", "Nginx"],
    summary:
      "The web platform around Terno: SSO and org provisioning for connector sign-up, the MCP connector flow, and the desktop connector proxy.",
  },
  {
    slug: "qr-transfer",
    name: "QR Transfer",
    kind: "personal",
    year: 2026,
    stack: ["Python", "HTML"],
    summary:
      "Move files to and from an air-gapped laptop using only QR codes and a phone camera. Standard library only.",
    url: "https://github.com/navinbhagat322/Qr-Transfer-",
  },
  {
    slug: "pdf-chatbot",
    name: "PDF Chatbot",
    kind: "personal",
    year: 2025,
    stack: ["LLMs", "Embeddings", "Vector store"],
    summary: "A RAG chatbot that answers questions from uploaded PDF documents.",
    url: "https://github.com/navinbhagat322/Intern_chatbot_P",
  },
  {
    slug: "concall-sentiment",
    name: "Concall Sentiment",
    kind: "personal",
    year: 2025,
    stack: ["NLP", "Python"],
    summary:
      "Sentiment analysis of earnings-call transcripts, and how it lines up with market moves.",
    url: "https://github.com/navinbhagat322/Concall_Sentiment_analysis_project",
  },
  {
    slug: "steel-strength",
    name: "Steel Strength Prediction",
    kind: "personal",
    year: 2025,
    stack: ["scikit-learn", "Materials"],
    summary:
      "Predicting mechanical properties of steels from composition and heat treatment with ML.",
    url: "https://github.com/navinbhagat322/Steel-Strength-prediction-DC-Project",
  },
  {
    slug: "logreg-visualizer",
    name: "Logistic Regression Visualizer",
    kind: "personal",
    year: 2025,
    stack: ["Streamlit", "scikit-learn"],
    summary: "Interactive app to see how hyperparameters shape a logistic regression decision boundary.",
    url: "https://github.com/navinbhagat322/Logistic_Regression_Visualizer",
  },
];

export interface Role {
  org: string;
  title: string;
  kind: "full-time" | "internship" | "education";
  period: string;
  current?: boolean;
  points: string[];
}

export const experience: Role[] = [
  {
    org: "TernoAI",
    title: "AI Engineer · Software Developer",
    kind: "full-time",
    period: "now",
    current: true,
    points: [
      "Core engineer on TernoDBI, the open-source data layer for AI agents",
      "Built the hosted MCP server, OAuth flows and API connectors (GA4, Ads, Shopify, HubSpot …)",
      "Work across the agent, the web platform and SQLShield",
    ],
  },
  {
    org: "CloudxLab",
    title: "Data Science & ML Intern",
    kind: "internship",
    period: "",
    points: ["Built an LLM + vector-store chatbot over PDF documents"],
  },
  {
    org: "Tata Steel",
    title: "Product R&D Intern",
    kind: "internship",
    period: "",
    points: ["ML models for predicting mechanical properties of steel"],
  },
  {
    org: "IIT Jodhpur",
    title: "B.Tech",
    kind: "education",
    period: "",
    points: ["CGPA 8.15"],
  },
];

export interface Skill {
  name: string;
  area: "languages" | "ai / ml" | "backend" | "infra";
}

const group = (area: Skill["area"], names: string[]): Skill[] => names.map((name) => ({ name, area }));

export const skills: Skill[] = [
  ...group("languages", ["Python", "SQL", "TypeScript", "JavaScript", "C"]),
  ...group("ai / ml", ["LLM agents", "MCP", "RAG", "text-to-SQL", "PyTorch", "scikit-learn", "pandas", "NumPy"]),
  ...group("backend", ["Django", "REST APIs", "OAuth 2.0", "PostgreSQL", "MySQL", "Snowflake", "BigQuery"]),
  ...group("infra", ["AWS", "Docker", "Nginx", "Linux", "GitHub Actions", "Git"]),
];
