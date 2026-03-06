import { all, run } from "./db.js";

const SEED_IDEAS = [
  {
    title: "Privacy Gateway",
    description: "A sidecar service that anonymizes NAD and Static Scanner data before sending it to the Invicti infrastructure. Built with Go + React/TS UI, following a 19-week development roadmap covering proxy layer, rule engine, and admin dashboard.",
    category: "Security",
    status: "In Progress",
    priority: "High",
    tags: ["Go", "Kubernetes", "NAD", "Privacy"],
    date: "2026-02-10",
    link: "",
    notes: "Phase 1 proxy layer complete. Working on rule engine with regex & JSONPath matchers.",
  },
  {
    title: "Universal Polyglot API Scanner",
    description: "A CLI tool that performs Shadow API detection across Python, .NET, Go, Java, and JS codebases. Outputs OpenAPI 3.0 specs for seamless DAST integration. Supports framework-aware route extraction and dead endpoint detection.",
    category: "Tool",
    status: "Completed",
    priority: "Medium",
    tags: ["Python", "DAST", "OpenAPI", "Shadow API"],
    date: "2026-01-20",
    link: "",
    notes: "Successfully tested against 12 internal repos. Detected 47 undocumented endpoints.",
  },
  {
    title: "Jira MCP Server",
    description: "A TypeScript MCP Server that connects Claude to Jira. Provides 9 tools including scan comparison, regression detection, and DAST quality gate automation. Enables AI-driven vulnerability triage workflows.",
    category: "AI/ML",
    status: "Completed",
    priority: "Medium",
    tags: ["TypeScript", "MCP", "Claude", "Jira"],
    date: "2026-01-05",
    link: "",
    notes: "Deployed to internal team. Reduced triage time by ~40%.",
  },
  {
    title: "API Contract Drift Detector",
    description: "Monitors deployed APIs against their OpenAPI specs in CI/CD pipelines. Detects schema drift, missing endpoints, and undocumented response codes. Integrates with GitHub Actions and GitLab CI.",
    category: "API",
    status: "Idea",
    priority: "High",
    tags: ["OpenAPI", "CI/CD", "GitHub Actions", "Schema Validation"],
    date: "2026-03-01",
    link: "",
    notes: "",
  },
  {
    title: "Vulnerability Knowledge Graph",
    description: "Graph database (Neo4j) mapping relationships between vulnerabilities, affected components, exploit chains, and remediation steps. Powers an AI assistant that suggests fix priorities based on attack path analysis.",
    category: "AI/ML",
    status: "Idea",
    priority: "Low",
    tags: ["Neo4j", "Graph DB", "NLP", "Vulnerability Management"],
    date: "2026-02-28",
    link: "",
    notes: "Research phase. Evaluating Neo4j vs Amazon Neptune.",
  },
];

const count = all("SELECT COUNT(*) as c FROM ideas")[0]?.c || 0;
if (count === 0) {
  for (const idea of SEED_IDEAS) {
    run(
      `INSERT INTO ideas (title, description, category, status, priority, tags, date, link, notes)
       VALUES ($title, $description, $category, $status, $priority, $tags, $date, $link, $notes)`,
      {
        $title: idea.title,
        $description: idea.description,
        $category: idea.category,
        $status: idea.status,
        $priority: idea.priority,
        $tags: JSON.stringify(idea.tags),
        $date: idea.date,
        $link: idea.link,
        $notes: idea.notes,
      }
    );
  }
  console.log(`Seeded ${SEED_IDEAS.length} ideas into the database.`);
} else {
  console.log(`Database already has ${count} ideas. Skipping seed.`);
}
