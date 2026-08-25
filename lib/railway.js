import "server-only";

const ENDPOINT = "https://backboard.railway.com/graphql/v2";

function esc(s) {
  return String(s).replace(/"/g, '\\"');
}

async function gql(query) {
  const token = process.env.RAILWAY_API_TOKEN;
  if (!token) throw new Error("Falta RAILWAY_API_TOKEN");

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`Railway ha respost ${res.status}`);
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0]?.message || "Error de Railway");
  return json.data;
}

/** Projectes, serveis i entorns del workspace. */
async function fetchProjects(workspaceId) {
  const data = await gql(`query {
    workspace(workspaceId: "${esc(workspaceId)}") {
      name
      projects { edges { node {
        id name description
        services { edges { node { id name } } }
        environments { edges { node { id name } } }
      } } }
    }
  }`);
  const ws = data?.workspace;
  if (!ws) return { name: "", projects: [] };
  return {
    name: ws.name,
    projects: ws.projects.edges.map(e => ({
      id: e.node.id,
      name: e.node.name,
      description: e.node.description || "",
      services: e.node.services.edges.map(s => s.node),
      envId: (e.node.environments.edges.find(x => x.node.name === "production")
        || e.node.environments.edges[0])?.node.id || null,
    })),
  };
}

/**
 * Dominis i ultim desplegament de molts serveis alhora.
 * Fem servir alies GraphQL per no encadenar desenes de peticions.
 */
async function fetchServiceDetail(targets) {
  if (targets.length === 0) return {};
  const parts = targets.map((t, i) => `
    d${i}: domains(projectId: "${esc(t.projectId)}", environmentId: "${esc(t.envId)}", serviceId: "${esc(t.serviceId)}") {
      serviceDomains { domain }
      customDomains { domain status { certificateStatus verified } }
    }
    p${i}: deployments(first: 1, input: {projectId: "${esc(t.projectId)}", environmentId: "${esc(t.envId)}", serviceId: "${esc(t.serviceId)}"}) {
      edges { node { status createdAt meta } }
    }`);
  const data = await gql(`query { ${parts.join("\n")} }`);

  const out = {};
  targets.forEach((t, i) => {
    const dom = data[`d${i}`] || {};
    const dep = data[`p${i}`]?.edges?.[0]?.node || null;
    const meta = dep?.meta || {};
    out[t.serviceId] = {
      serviceDomains: (dom.serviceDomains || []).map(x => x.domain),
      customDomains: (dom.customDomains || []).map(x => ({
        domain: x.domain,
        cert: x.status?.certificateStatus || null,
        verified: !!x.status?.verified,
      })),
      deploy: dep
        ? {
            status: dep.status,
            at: dep.createdAt,
            commit: (meta.commitMessage || "").split("\n")[0] || null,
            hash: meta.commitHash ? String(meta.commitHash).slice(0, 7) : null,
            repo: meta.repo || null,
            branch: meta.branch || null,
          }
        : null,
    };
  });
  return out;
}

/** Consum estimat del periode en curs, agregat per projecte. */
async function fetchUsage(workspaceId) {
  const data = await gql(`query {
    estimatedUsage(workspaceId: "${esc(workspaceId)}", measurements: [CPU_USAGE, MEMORY_USAGE_GB, NETWORK_TX_GB, DISK_USAGE_GB]) {
      measurement estimatedValue projectId
    }
  }`);
  const by = {};
  for (const row of data.estimatedUsage || []) {
    by[row.projectId] = by[row.projectId] || {};
    by[row.projectId][row.measurement] = row.estimatedValue;
  }
  return by;
}

/** Tot el que necessita el panell, en tres rondes de peticions. */
export async function getPanelData() {
  const workspaceId = process.env.RAILWAY_WORKSPACE_ID;
  if (!workspaceId) throw new Error("Falta RAILWAY_WORKSPACE_ID");

  const { name: workspace, projects } = await fetchProjects(workspaceId);

  const targets = [];
  for (const p of projects) {
    if (!p.envId) continue;
    for (const s of p.services) {
      if (/^Postgres/i.test(s.name)) continue;
      targets.push({ projectId: p.id, envId: p.envId, serviceId: s.id });
    }
  }

  const [detail, usage] = await Promise.all([
    fetchServiceDetail(targets),
    fetchUsage(workspaceId).catch(() => ({})),
  ]);

  const apps = projects
    .map(p => ({
      ...p,
      databases: p.services.filter(s => /^Postgres/i.test(s.name)).length,
      services: p.services
        .filter(s => !/^Postgres/i.test(s.name))
        .map(s => ({ ...s, ...(detail[s.id] || {}) })),
      usage: usage[p.id] || null,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return { workspace, apps, generatedAt: new Date().toISOString() };
}
