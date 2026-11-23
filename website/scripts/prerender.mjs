import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");

const ROUTES = ["/", "/features", "/about", "/book-demo", "/contact", "/pricing", "/privacy", "/terms"];

function loadEnvFile() {
  const candidates = [path.join(root, ".env"), path.join(root, ".env.production"), path.join(root, ".env.local")];
  for (const file of candidates) {
    if (!fs.existsSync(file)) continue;
    const text = fs.readFileSync(file, "utf8");
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = value;
    }
  }
}

function routeToDir(route) {
  if (route === "/") return dist;
  const segment = route.replace(/^\//, "");
  return path.join(dist, segment);
}

function copyIndexForRoutes() {
  const indexPath = path.join(dist, "index.html");
  if (!fs.existsSync(indexPath)) {
    console.error("prerender: dist/index.html not found. Run vite build first.");
    process.exit(1);
  }
  const html = fs.readFileSync(indexPath, "utf8");

  for (const route of ROUTES) {
    const dir = routeToDir(route);
    fs.mkdirSync(dir, { recursive: true });
    const target = path.join(dir, "index.html");
    if (route === "/") {
      fs.writeFileSync(target, html, "utf8");
    } else {
      fs.writeFileSync(target, html, "utf8");
    }
  }
}

function replaceSiteUrlInPublicFile(relativePath) {
  const siteUrl = (process.env.VITE_SITE_URL || "").replace(/\/$/, "");
  if (!siteUrl) return;
  const filePath = path.join(dist, relativePath);
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, "utf8");
  content = content.replace(/https:\/\/helperbook\.example/g, siteUrl);
  fs.writeFileSync(filePath, content, "utf8");
}

loadEnvFile();
copyIndexForRoutes();
replaceSiteUrlInPublicFile("robots.txt");
replaceSiteUrlInPublicFile("sitemap.xml");

console.log("prerender: route shells written to dist/");
if (process.env.VITE_SITE_URL) {
  console.log(`prerender: updated robots.txt and sitemap.xml with ${process.env.VITE_SITE_URL}`);
}