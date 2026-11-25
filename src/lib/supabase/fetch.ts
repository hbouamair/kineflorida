import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

function resetCode(error: unknown) {
  if (!(error instanceof Error)) return "";
  const cause = "cause" in error ? error.cause : undefined;
  const code = cause && typeof cause === "object" && "code" in cause ? String(cause.code) : "";
  return `${code} ${error.message}`;
}

async function curlFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const request = input instanceof Request ? input : null;
  const url = request ? request.url : String(input);
  const method = init?.method ?? request?.method ?? "GET";
  const headers = new Headers(init?.headers ?? request?.headers);
  const rawBody = init?.body ?? (request ? await request.arrayBuffer() : undefined);
  const body =
    rawBody == null
      ? ""
      : typeof rawBody === "string"
        ? rawBody
        : Buffer.from(rawBody as ArrayBuffer).toString("utf8");

  const dir = await mkdtemp(join(tmpdir(), "kf-"));
  const headerFile = join(dir, "headers.txt");
  const outFile = join(dir, "out.bin");
  const bodyFile = join(dir, "body.bin");

  try {
    if (body) await writeFile(bodyFile, body);
    const args = ["--tlsv1.2", "-sS", "-m", "25", "-D", headerFile, "-o", outFile, "-X", method, "-w", "%{http_code}"];
    headers.forEach((value, key) => {
      if (key.toLowerCase() === "content-length" || key.toLowerCase() === "host") return;
      args.push("-H", `${key}: ${value}`);
    });
    if (body) args.push("--data-binary", `@${bodyFile}`);
    args.push(url);

    const { stdout } = await execFileAsync("curl.exe", args, { windowsHide: true, maxBuffer: 4_000_000 });
    const status = Number(stdout.trim());
    const rawHeaders = await readFile(headerFile, "utf8");
    const rawBody = await readFile(outFile);
    const responseHeaders = new Headers();
    const blocks = rawHeaders.trim().split(/\r?\n\r?\n/);
    const last = blocks[blocks.length - 1] ?? "";
    for (const line of last.split(/\r?\n/)) {
      const index = line.indexOf(":");
      if (index > 0 && !line.startsWith("HTTP/")) {
        responseHeaders.append(line.slice(0, index).trim(), line.slice(index + 1).trim());
      }
    }
    return new Response(rawBody, { status: Number.isFinite(status) ? status : 502, headers: responseHeaders });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

/** Node's TLS handshake to Supabase is reset on this network. Windows curl is not. */
export async function resilientFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(input, init);
  } catch (error) {
    if (process.platform !== "win32" || !/ECONNRESET|ECONNREFUSED|ETIMEDOUT|fetch failed/i.test(resetCode(error))) {
      throw error;
    }
    return curlFetch(input, init);
  }
}
