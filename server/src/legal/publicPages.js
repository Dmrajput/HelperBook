import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function legalFile(name) {
  const candidates = [
    path.resolve(__dirname, "../../../docs/legal", name),
    path.resolve(process.cwd(), "docs/legal", name),
    path.resolve(process.cwd(), "../docs/legal", name),
  ];
  return candidates.find((candidate) => fs.existsSync(candidate)) || null;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function sendLegalPage(res, fileName, title) {
  const filePath = legalFile(fileName);
  if (!filePath) {
    res.status(404).type("text/plain").send("This page is not available.");
    return;
  }

  const body = fs.readFileSync(filePath, "utf8");
  res.status(200).type("html").send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: Georgia, serif; margin: 0; background: #f4f7f5; color: #1c2b26; }
    main { max-width: 42rem; margin: 0 auto; padding: 2rem 1.25rem 4rem; }
    pre { white-space: pre-wrap; font-family: Georgia, serif; font-size: 1.05rem; line-height: 1.5; }
  </style>
</head>
<body>
  <main><pre>${escapeHtml(body)}</pre></main>
</body>
</html>`);
}
