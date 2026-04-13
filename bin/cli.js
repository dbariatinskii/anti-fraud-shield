#!/usr/bin/env node
import { createRequire } from 'module'; const require = createRequire(import.meta.url);

// bin/cli.mjs
import { createServer } from "node:http";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import serveHandler from "serve-handler";
import open from "open";
var __dirname = dirname(fileURLToPath(import.meta.url));
var ROOT_DIR = resolve(__dirname, "..");
var STATIC_DIR = resolve(ROOT_DIR, "static");
var DIST_SINGLE_DIR = resolve(ROOT_DIR, "dist-single");
var args = process.argv.slice(2);
var helpFlag = args.includes("--help") || args.includes("-h");
var staticFlag = args.includes("--static");
var portIdx = args.indexOf("--port");
var port = portIdx >= 0 ? parseInt(args[portIdx + 1], 10) : 3e3;
if (helpFlag) {
  console.log(`
Anti-Fraud Shield \u2014 \u0431\u0440\u0430\u0443\u0437\u0435\u0440\u043D\u0430\u044F \u043C\u0438\u043D\u0438-\u0438\u0433\u0440\u0430

\u0418\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u043D\u0438\u0435:
  npx anti-fraud-shield              \u0417\u0430\u043F\u0443\u0441\u043A HTTP-\u0441\u0435\u0440\u0432\u0435\u0440\u0430 (\u043F\u043E\u0440\u0442 3000)
  npx anti-fraud-shield --port 8080  \u0417\u0430\u043F\u0443\u0441\u043A \u043D\u0430 \u0443\u043A\u0430\u0437\u0430\u043D\u043D\u043E\u043C \u043F\u043E\u0440\u0442\u0443
  npx anti-fraud-shield --static     \u0413\u0435\u043D\u0435\u0440\u0430\u0446\u0438\u044F single HTML \u0444\u0430\u0439\u043B\u0430
  npx anti-fraud-shield --help       \u041F\u043E\u043A\u0430\u0437\u0430\u0442\u044C \u0441\u043F\u0440\u0430\u0432\u043A\u0443
`);
  process.exit(0);
}
if (staticFlag) {
  console.log("\u{1F4E6} \u0413\u0435\u043D\u0435\u0440\u0430\u0446\u0438\u044F single HTML...");
  if (!existsSync(STATIC_DIR)) {
    console.log("  \u2192 \u0421\u0431\u043E\u0440\u043A\u0430 \u043F\u0440\u043E\u0435\u043A\u0442\u0430...");
    execSync("npm run build", { cwd: ROOT_DIR, stdio: "inherit" });
  }
  execSync("node bin/build-static.mjs", { cwd: ROOT_DIR, stdio: "inherit" });
  const htmlPath = resolve(DIST_SINGLE_DIR, "anti-fraud-shield.html");
  if (existsSync(htmlPath)) {
    console.log(`\u2705 \u0424\u0430\u0439\u043B \u0441\u043E\u0437\u0434\u0430\u043D: ${htmlPath}`);
    open(htmlPath);
  } else {
    console.error("\u274C \u041E\u0448\u0438\u0431\u043A\u0430 \u0433\u0435\u043D\u0435\u0440\u0430\u0446\u0438\u0438 single HTML");
    process.exit(1);
  }
  process.exit(0);
}
if (!existsSync(STATIC_DIR)) {
  console.log("\u{1F4E6} \u0414\u0438\u0440\u0435\u043A\u0442\u043E\u0440\u0438\u044F static/ \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430. \u0417\u0430\u043F\u0443\u0441\u043A\u0430\u044E \u0441\u0431\u043E\u0440\u043A\u0443...");
  try {
    execSync("npm run build", { cwd: ROOT_DIR, stdio: "inherit" });
  } catch {
    console.error("\u274C \u0421\u0431\u043E\u0440\u043A\u0430 \u043D\u0435 \u0443\u0434\u0430\u043B\u0430\u0441\u044C");
    process.exit(1);
  }
}
function findFreePort(startPort) {
  return new Promise((resolve2, reject) => {
    const server = createServer();
    server.listen(startPort, () => {
      const { port: freePort } = server.address();
      server.close(() => resolve2(freePort));
    });
    server.on("error", () => {
      findFreePort(startPort + 1).then(resolve2).catch(reject);
    });
  });
}
async function startServer() {
  const actualPort = await findFreePort(port);
  const server = createServer((req, res) => {
    return serveHandler(req, res, {
      public: STATIC_DIR,
      headers: [
        {
          source: "**/*",
          headers: [
            { key: "Cache-Control", value: "no-cache" }
          ]
        }
      ]
    });
  });
  server.listen(actualPort, () => {
    const url = `http://localhost:${actualPort}`;
    console.log(`\u{1F6E1}\uFE0F  Anti-Fraud Shield \u0437\u0430\u043F\u0443\u0449\u0435\u043D: ${url}`);
    console.log("\u041D\u0430\u0436\u043C\u0438\u0442\u0435 Ctrl+C \u0434\u043B\u044F \u043E\u0441\u0442\u0430\u043D\u043E\u0432\u043A\u0438");
    open(url);
  });
  process.on("SIGINT", () => {
    console.log("\n\u{1F44B} \u041E\u0441\u0442\u0430\u043D\u043E\u0432\u043A\u0430 \u0441\u0435\u0440\u0432\u0435\u0440\u0430...");
    server.close(() => process.exit(0));
  });
}
startServer();
