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

/**
 * Trafic HTTP agregat de tots els serveis, agrupat per codi d estat.
 * Railway limita a 1000 punts per serie, per aixo calculem el pas.
 */
export async function getTrafficData(dies = 7) {
  const workspaceId = process.env.RAILWAY_WORKSPACE_ID;
  if (!workspaceId) throw new Error("Falta RAILWAY_WORKSPACE_ID");

  const { projects } = await fetchProjects(workspaceId);
  const targets = [];
  for (const p of projects) {
    if (!p.envId) continue;
    for (const s of p.services) {
      if (/^Postgres/i.test(s.name)) continue;
      targets.push({ project: p.name, service: s.name, envId: p.envId, serviceId: s.id });
    }
  }
  if (targets.length === 0) return { apps: [], serie: [], total: 0, errors: 0, dies };

  const end = new Date();
  const start = new Date(end.getTime() - dies * 86400000);
  const step = dies <= 1 ? 900 : dies <= 7 ? 3600 : 21600;

  /*
   * Railway nomes deixa 19 consultes de registre HTTP simultanies per espai de
   * treball, i cada alias del lot en compta una. Amb prou serveis, demanar-ho
   * tot de cop falla sencer. Ho partim en trossos i els demanem un darrere
   * l altre.
   */
  const PER_LOT = 10;
  const data = {};
  let fallats = 0;

  for (let inici = 0; inici < targets.length; inici += PER_LOT) {
    const tros = targets.slice(inici, inici + PER_LOT);
    const parts = tros.map((t, j) => `
    t${inici + j}: httpMetricsGroupedByStatus(
      environmentId: "${esc(t.envId)}", serviceId: "${esc(t.serviceId)}",
      startDate: "${start.toISOString()}", endDate: "${end.toISOString()}", stepSeconds: ${step}
    ) { statusCode samples { ts value } }`);

    try {
      Object.assign(data, await gql(`query { ${parts.join("\n")} }`));
    } catch (e) {
      // Un tros que falla no ha de deixar la pagina sense les dades dels altres.
      console.error(`Trafic: el lot ${inici / PER_LOT + 1} no ha respost:`, e.message);
      fallats += tros.length;
    }
  }

  if (fallats === targets.length) {
    return { apps: [], serie: [], total: 0, errors: 0, dies, indisponible: true };
  }

  const serieMap = new Map(); // ts -> { ok, err }
  const apps = [];

  // Un 404 de bot, un 429 de limit i un 500 de servidor son problemes
  // completament diferents. Agrupar-los tots com "error" no informa de res.
  const bucket = code => {
    if (code >= 500) return "servidor";
    if (code === 429) return "limit";
    if (code === 404) return "noTrobat";
    if (code >= 400) return "altres4xx";
    return "ok";
  };

  targets.forEach((t, i) => {
    const grups = data[`t${i}`] || [];
    let total = 0;
    const b = { ok: 0, noTrobat: 0, limit: 0, altres4xx: 0, servidor: 0 };
    const propia = new Map();
    for (const g of grups) {
      const k = bucket(g.statusCode);
      for (const s of g.samples || []) {
        const v = s.value || 0;
        total += v;
        b[k] += v;
        propia.set(s.ts, (propia.get(s.ts) || 0) + v);
        const acc = serieMap.get(s.ts) || { ok: 0, err: 0 };
        if (k === "ok") acc.ok += v; else acc.err += v;
        serieMap.set(s.ts, acc);
      }
    }
    if (total > 0) {
      apps.push({
        name: t.project,
        service: t.service,
        total: Math.round(total),
        ok: Math.round(b.ok),
        noTrobat: Math.round(b.noTrobat),
        limit: Math.round(b.limit),
        altres4xx: Math.round(b.altres4xx),
        servidor: Math.round(b.servidor),
        errors: Math.round(b.noTrobat + b.limit + b.altres4xx + b.servidor),
        pics: [...propia.entries()].sort((a, b2) => a[0] - b2[0]).map(([, v]) => v),
      });
    }
  });

  apps.sort((a, b) => b.total - a.total);
  const incomplet = fallats > 0;
  const serie = [...serieMap.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([ts, v]) => ({ ts, ok: v.ok, err: v.err }));

  const suma = camp => apps.reduce((n, a) => n + (a[camp] || 0), 0);
  return {
    apps,
    serie,
    total: suma("total"),
    errors: suma("errors"),
    noTrobat: suma("noTrobat"),
    limit: suma("limit"),
    servidor: suma("servidor"),
    dies,
    incomplet,
    generatedAt: new Date().toISOString(),
  };
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
