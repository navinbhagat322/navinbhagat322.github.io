// Everything the site says lives here. Edit this file, not the engine.
// Source of truth: Navin's résumé + public GitHub activity.

export const site = {
  goatcounter: "navinkumar",
};

export const profile = {
  name: "Navin Kumar",
  handle: "navin",
  host: "terno",
  role: "AI Software Engineer",
  company: "CloudxLab",
  project: "Terno AI",
  location: "India",
  tagline:
    "I build AI agents and everything they need to work on real data — agent frameworks, evaluation pipelines, RAG memory, MCP servers and safe text-to-SQL.",
  education: "B.Tech, IIT Jodhpur",
  focus: ["AI agents", "agent evals", "RAG", "MCP", "text-to-SQL"],
  offline: ["film-making", "photography", "fitness", "meditation"],
};

/** What I build — shown on the opening screen, the about page and the plain page. */
export const focusAreas = [
  { icon: "sparkle", title: "AI agents", body: "Custom and framework agents — LangChain, CrewAI, AutoGen, OpenAI SDK — that reason over real databases." },
  { icon: "check", title: "Agent evals", body: "A regression-testing framework that scores agent output against expected SQL results." },
  { icon: "database", title: "RAG memory", body: "Self-improving semantic memory in Milvus with dedup and LLM-driven compression." },
  { icon: "command", title: "MCP & SQL", body: "MCP servers and a multi-threaded host, with guarded, streaming SQL execution." },
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
    slug: "agents",
    name: "Terno AI agents",
    kind: "work",
    year: 2026,
    stack: ["LangChain", "CrewAI", "AutoGen", "OpenAI SDK", "MCP"],
    summary:
      "Custom and framework-based AI agents that inspect database schemas, sample data and solve complex SQL reasoning tasks.",
    highlights: [
      "Agents built with LangChain, CrewAI, AutoGen and the OpenAI SDK, plus custom ones",
      "Dynamic MCP tool adapters so any agent can inspect schemas and sample data",
      "Prompting, org memory, plan mode and notebook-style reports in the Terno agent",
    ],
    url: "https://github.com/terno-ai/terno-agent",
    featured: true,
  },
  {
    slug: "evals",
    name: "Agent evaluation framework",
    kind: "work",
    year: 2026,
    stack: ["Django", "Celery", "pandas"],
    summary:
      "Production-grade regression testing for LLM agents: agent-generated tables are compared with expected SQL query results.",
    highlights: [
      "Automated regression runs with Django and Celery",
      "Tolerance-aware DataFrame comparison engine, so small numeric or ordering differences don't fail a run",
    ],
    featured: true,
  },
  {
    slug: "ternodbi",
    name: "TernoDBI",
    kind: "open-source",
    year: 2026,
    stack: ["Python", "Django", "MCP", "OAuth", "SQL"],
    summary:
      "An open-source MCP server, published on PyPI, that lets AI agents query databases in natural language — scoped, validated and explained.",
    highlights: [
      "Top contributor — 280+ commits",
      "Hosted MCP server with OAuth and dynamic client registration (works with Claude, Cursor, ChatGPT)",
      "Service-token scopes, multi-tenancy and encrypted credentials",
      "Server-side streaming and cursor pagination for enterprise-scale results",
      "API connectors: GA4, Google Ads, Meta Ads, YouTube, Search Console, HubSpot, Shopify, Instagram",
    ],
    url: "https://github.com/terno-ai/ternodbi",
    featured: true,
  },
  {
    slug: "rag-memory",
    name: "Semantic RAG memory",
    kind: "work",
    year: 2026,
    stack: ["Milvus", "Embeddings", "LLMs"],
    summary:
      "A self-improving memory for agents: vector deduplication and LLM-driven cluster compression keep context quality improving over time.",
  },
  {
    slug: "mcp-host",
    name: "Multi-threaded MCP host",
    kind: "work",
    year: 2026,
    stack: ["Python", "asyncio", "MCP"],
    summary:
      "An MCP host that runs tool execution on a dedicated event-loop thread, isolating agents and removing CPU bottlenecks.",
  },
  {
    slug: "sqlshield",
    name: "LLM SQL Shield",
    kind: "open-source",
    year: 2025,
    stack: ["Python", "sqlglot", "Snowflake"],
    summary:
      "Secures agentic SQL execution: syntax validation, alias correction and fine-grained table and column access control.",
    url: "https://pypi.org/project/sqlshield/",
  },
  {
    slug: "pyquest",
    name: "PyQuest",
    kind: "work",
    year: 2025,
    stack: ["Flutter", "Django", "JWT"],
    summary:
      "CloudxLab's learning app, shipped on the Play Store — with secure JWT auth and XP and streak gamification that improved retention.",
  },
  {
    slug: "fin-assistant",
    name: "Financial Analytics Assistant",
    kind: "work",
    year: 2024,
    stack: ["LangChain", "FAISS", "Ollama", "Streamlit"],
    summary:
      "A RAG chatbot over financial transcripts (LLaMA 3.2 via Ollama), with multi-PDF upload and real-time chat in Streamlit.",
    url: "https://github.com/navinbhagat322/Intern_chatbot_P",
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
    slug: "concall-sentiment",
    name: "Concall Sentiment",
    kind: "personal",
    year: 2025,
    stack: ["NLP", "Python"],
    summary: "Sentiment analysis of earnings-call transcripts, and how it lines up with market moves.",
    url: "https://github.com/navinbhagat322/Concall_Sentiment_analysis_project",
  },
  {
    slug: "steel-strength",
    name: "Steel Strength Prediction",
    kind: "personal",
    year: 2025,
    stack: ["scikit-learn", "Materials"],
    summary: "Predicting mechanical properties of steels from composition and heat treatment with ML.",
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
    org: "CloudxLab",
    title: "AI Software Engineer · Terno AI",
    kind: "full-time",
    period: "Oct 2025 – now",
    current: true,
    points: [
      "Built custom and framework agents (LangChain, CrewAI, AutoGen, OpenAI SDK) with dynamic MCP tool adapters",
      "Built a production agent evaluation framework with Django and Celery",
      "Designed a self-improving semantic RAG memory in Milvus",
      "Published TernoDBI on PyPI; secured agent SQL with LLM SQL Shield; built a multi-threaded MCP host",
    ],
  },
  {
    org: "CloudxLab",
    title: "Software Development Engineer Intern · PyQuest",
    kind: "internship",
    period: "Feb – Sep 2025",
    points: [
      "Shipped the PyQuest Flutter app to the Play Store",
      "Secure auth with headless Django APIs and JWT; XP and streak gamification",
    ],
  },
  {
    org: "Scientific Investing",
    title: "AI Intern · Financial Analytics Assistant",
    kind: "internship",
    period: "Nov – Dec 2024",
    points: ["RAG chatbot over financial transcripts with LangChain, FAISS and Ollama (LLaMA 3.2)"],
  },
  {
    org: "Tata Steel",
    title: "Research & Development Intern",
    kind: "internship",
    period: "May – Jul 2024",
    points: ["Improved electrical conductivity of FRP composites by 10%; analysed results with pandas"],
  },
  {
    org: "IIT Jodhpur",
    title: "B.Tech, Material Science Engineering",
    kind: "education",
    period: "2021 – 2025",
    points: ["CGPA 8.15 · SGPAs of 9.61 and 9.05 in the final semesters"],
  },
];

export interface Skill {
  name: string;
  area: "languages" | "ai / ml" | "web & mobile" | "tools & cloud";
}

const group = (area: Skill["area"], names: string[]): Skill[] => names.map((name) => ({ name, area }));

export const skills: Skill[] = [
  ...group("languages", ["Python", "SQL", "Dart", "JavaScript", "HTML/CSS"]),
  ...group("ai / ml", ["Agentic AI", "MCP", "RAG", "text-to-SQL", "LangChain", "CrewAI", "AutoGen", "PyTorch", "Hugging Face", "scikit-learn", "FAISS", "Milvus", "pandas", "NumPy"]),
  ...group("web & mobile", ["Django", "Celery", "React", "Flutter", "Streamlit", "REST APIs"]),
  ...group("tools & cloud", ["Docker", "Git", "CI/CD", "AWS", "PyPI", "Google Play Console"]),
];

/** The 30-second version, for people who don't want to explore. */
export const recruiter = {
  pitch:
    "AI Software Engineer at CloudxLab, building Terno AI. I build production AI agents and the systems around them — evals, memory, MCP and safe SQL execution.",
  highlights: [
    {
      title: "AI agents in production",
      body: "Custom and framework agents (LangChain, CrewAI, AutoGen, OpenAI SDK) with MCP tool adapters for schema inspection and SQL reasoning.",
      href: "https://github.com/terno-ai/terno-agent",
    },
    {
      title: "Agent evaluation framework",
      body: "Django + Celery regression testing that compares agent output with expected SQL results, tolerance-aware.",
    },
    {
      title: "Self-improving RAG memory",
      body: "Semantic memory in Milvus with vector dedup and LLM-driven cluster compression.",
    },
    {
      title: "TernoDBI & SQL Shield",
      body: "Published an MCP server on PyPI (280+ commits) and secured agent SQL with validation and table/column access control.",
      href: "https://github.com/terno-ai/ternodbi",
    },
  ],
  facts: [
    ["role", "AI Software Engineer @ CloudxLab (Terno AI)"],
    ["education", "B.Tech, IIT Jodhpur · CGPA 8.15"],
    ["stack", "Python · Django · LangChain · MCP · RAG · PyTorch"],
    ["based in", "India"],
  ] as [string, string][],
};
