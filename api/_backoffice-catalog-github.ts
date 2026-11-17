import type { CatalogTool } from "../src/lib/backofficeCatalog.js";
import {
  CATALOG_REPO,
  CATALOG_PATH,
  CATALOG_BRANCH,
  catalogError,
  validSlug,
} from "./_backoffice-catalog-contract.js";
export type CatalogSource = {
  headSha: string;
  treeSha: string;
  tools: CatalogTool[];
  text: string;
};
const sha = (v: unknown): string => {
  if (typeof v !== "string" || !/^[a-f0-9]{40}$/.test(v)) throw catalogError();
  return v;
};
async function github(
  path: string,
  method = "GET",
  body?: unknown,
  raw = false,
): Promise<unknown> {
  const token = process.env.BACKOFFICE_GITHUB_TOKEN;
  if (!token) throw catalogError(503, "CATALOG_GITHUB_NOT_CONFIGURED");
  let response: Response;
  try {
    response = await fetch(
      `https://api.github.com/repos/${CATALOG_REPO}/${path}`,
      {
        method,
        redirect: "error",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: raw
            ? "application/vnd.github.raw+json"
            : "application/vnd.github+json",
          "Content-Type": "application/json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        signal: AbortSignal.timeout(20000),
      },
    );
  } catch {
    throw catalogError();
  }
  if (!response.ok)
    throw catalogError(
      response.status === 409 || response.status === 422 ? 409 : 503,
      response.status === 409 || response.status === 422
        ? "CATALOG_SOURCE_CONFLICT"
        : "CATALOG_UNAVAILABLE",
    );
  if (raw) {
    const length = response.headers.get("content-length");
    if (length && Number(length) > 32 * 1024 * 1024) throw catalogError();
    const text = await response.text();
    if (Buffer.byteLength(text) > 32 * 1024 * 1024) throw catalogError();
    return text;
  }
  return response.json();
}
function catalogBranchPath() {
  const ref = process.env.CMS_CATALOG_BRANCH ?? CATALOG_BRANCH;
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_./-]{0,159}$/.test(ref) ||
    ref.includes("..") || ref.includes("//") || ref.endsWith("/") || ref.endsWith(".lock")) {
    throw catalogError(503, "CMS_CATALOG_BRANCH_INVALID");
  }
  return ref.split("/").map(encodeURIComponent).join("/");
}

async function head(): Promise<string> {
  const r = (await github(`git/ref/heads/${catalogBranchPath()}`)) as {
    object?: {
      sha?: unknown;
    };
  };
  return sha(r?.object?.sha);
}
// One immutable source per warm function instance. Main is still checked on
// every request, including mutations: no TTL can conceal a competing commit.
let cachedSource: { headSha: string; value: Promise<CatalogSource> } | undefined;
export async function readCatalog(): Promise<CatalogSource> {
  const headSha = await head();
  if (cachedSource?.headSha === headSha) return cachedSource.value;
  const entry = { headSha, value: downloadCatalog(headSha) };
  cachedSource = entry;
  try {
    return await entry.value;
  } catch (error) {
    if (cachedSource === entry) cachedSource = undefined;
    throw error;
  }
}
async function downloadCatalog(headSha: string): Promise<CatalogSource> {
  // Commit metadata and raw content are independent once pinned to the SHA.
  const [commit, text] = await Promise.all([
    github(`git/commits/${headSha}`),
    github(`contents/${CATALOG_PATH}?ref=${headSha}`, "GET", undefined, true),
  ]) as [{
    tree?: { sha?: unknown };
  }, string];
  const treeSha = sha(commit?.tree?.sha);
  let tools: CatalogTool[];
  try {
    const value: unknown = JSON.parse(text);
    if (
      !Array.isArray(value) ||
      !value.length ||
      value.some(
        (t) =>
          !t ||
          typeof t !== "object" ||
          !validSlug(t.slug) ||
          typeof t.id !== "string" ||
          typeof t.name !== "string",
      ) ||
      new Set(value.map((t) => t.slug)).size !== value.length ||
      new Set(value.map((t) => t.id)).size !== value.length
    )
      throw new Error();
    tools = value as CatalogTool[];
  } catch {
    throw catalogError();
  }
  return { headSha, treeSha, tools, text };
}
export async function readPublishedDescendant(baseSha: string, candidateSha: string) {
  const comparison = await github(`compare/${sha(baseSha)}...${sha(candidateSha)}?per_page=1`) as { status?: unknown };
  if (comparison?.status !== "ahead" && comparison?.status !== "identical") return null;
  return downloadCatalog(candidateSha);
}

const RELEASE_MARKER = "public/catalog-release.json";
export type CatalogReleaseArtifacts = {
  marker: { batchKey: string; catalogueHash: string };
  media: { path: string; bytes: Uint8Array }[];
};

export async function matchPublishedCatalogRelease(source: CatalogSource, marker: CatalogReleaseArtifacts["marker"]) {
  const raw = await github(`contents/${RELEASE_MARKER}?ref=${source.headSha}`, "GET", undefined, true)
    .catch((error) => {
      // A catalogue can predate the first CMS publication marker.
      if (error instanceof Error && error.message === "CATALOG_UNAVAILABLE") return null;
      throw error;
    });
  if (typeof raw !== "string") return null;
  const published = JSON.parse(raw);
  if (published?.batchKey !== marker.batchKey || published?.catalogueHash !== marker.catalogueHash) return null;
  const commits = await github(`commits?path=${encodeURIComponent(RELEASE_MARKER)}&sha=${source.headSha}&per_page=1`);
  if (!Array.isArray(commits) || !commits.length) throw catalogError();
  const commitSha = sha(commits[0]?.sha);
  return { commitSha, commitUrl: `https://github.com/${CATALOG_REPO}/commit/${commitSha}` };
}

export async function publishCatalog(
  source: CatalogSource,
  tools: CatalogTool[],
  artifacts?: CatalogReleaseArtifacts,
): Promise<{
  commitSha: string;
  commitUrl: string;
}> {
  const content =
    JSON.stringify(tools, null, 2) + (source.text.endsWith("\n") ? "\n" : "");
  const blob = (await github("git/blobs", "POST", {
    content: Buffer.from(content).toString("base64"),
    encoding: "base64",
  })) as {
    sha?: unknown;
  };
  const entries = [{ path: CATALOG_PATH, mode: "100644", type: "blob", sha: sha(blob?.sha) }];
  if (artifacts) {
    const files = [{ path: RELEASE_MARKER, bytes: Buffer.from(JSON.stringify(artifacts.marker)) }, ...artifacts.media];
    const paths = new Set<string>();
    for (const file of files) {
      if (paths.has(file.path) || (file.path !== RELEASE_MARKER
        && !/^public\/tool-media\/cms\/[a-f0-9-]{36}\/[a-f0-9]{64}\.webp$/.test(file.path))) throw catalogError();
      paths.add(file.path);
      const uploaded = await github("git/blobs", "POST", {
        content: Buffer.from(file.bytes).toString("base64"), encoding: "base64",
      }) as { sha?: unknown };
      entries.push({ path: file.path, mode: "100644", type: "blob", sha: sha(uploaded?.sha) });
    }
  }
  const tree = (await github("git/trees", "POST", {
    base_tree: source.treeSha,
    tree: entries,
  })) as {
    sha?: unknown;
  };
  const commit = (await github("git/commits", "POST", {
    message: artifacts ? `feat(catalog): publish batch ${artifacts.marker.batchKey.slice(0, 12)}`
      : "feat(catalog): publish back-office editorial drafts",
    tree: sha(tree?.sha),
    parents: [source.headSha],
  })) as {
    sha?: unknown;
  };
  const commitSha = sha(commit?.sha);
  let updateError: unknown;
  try {
    await github(`git/refs/heads/${catalogBranchPath()}`, "PATCH", {
      sha: commitSha,
      force: false,
    });
  } catch (e) {
    updateError = e;
  }
  // Ref writes can time out after GitHub accepts them. Verify before cleanup or
  // success; retrying the API reconciles identical published tool values safely.
  if ((await head()) !== commitSha)
    throw updateError ?? catalogError(409, "CATALOG_SOURCE_CONFLICT");
  return {
    commitSha,
    commitUrl: `https://github.com/${CATALOG_REPO}/commit/${commitSha}`,
  };
}
