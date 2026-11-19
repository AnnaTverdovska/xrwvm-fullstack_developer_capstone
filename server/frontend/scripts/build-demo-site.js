// Builds the static demo site for GitHub Pages into server/frontend/demo-site:
//
//   demo-site/index.html, about.html, contact.html   the static pages, with links rewritten
//   demo-site/static/                                 their images and styles
//   demo-site/app/                                    the React app in demo mode (hash routes)
//   demo-site/app/demo-data/                          the sample dealers and reviews
//
// Run with: npm run build:demo
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const frontend = path.resolve(__dirname, "..");
const site = path.join(frontend, "demo-site");
const staticPages = path.join(frontend, "static");
const sampleData = path.resolve(frontend, "..", "database", "data");
const REPO_URL = "https://github.com/AnnaTverdovska/xrwvm-fullstack_developer_capstone";

fs.rmSync(site, { recursive: true, force: true });
fs.mkdirSync(path.join(site, "static"), { recursive: true });

// 1. The React app, built with relative asset paths so it works in any folder
execSync("npx react-scripts build", {
  cwd: frontend,
  stdio: "inherit",
  env: { ...process.env, REACT_APP_DEMO: "true", PUBLIC_URL: ".", BUILD_PATH: path.join(site, "app"), CI: "false", GENERATE_SOURCEMAP: "false" },
});

// 2. Sample data, loaded by src/demo/demoApi.js
fs.mkdirSync(path.join(site, "app", "demo-data"));
for (const file of ["dealerships.json", "reviews.json"]) {
  fs.copyFileSync(path.join(sampleData, file), path.join(site, "app", "demo-data", file));
}

// 3. Static pages with links pointing into the demo, plus the demo banner
const banner =
  '<div role="note" style="position:relative;z-index:10;background:#fff3cd;color:#4d3b00;padding:8px 16px;font-size:15px;text-align:center">' +
  'Demo with sample data: "Best Cars" is fictional, and accounts and reviews you add are saved only in this browser. ' +
  "The full app runs on Django, Express/MongoDB and a Flask service. " +
  `<a href="${REPO_URL}">See the code on GitHub</a>. <a href="licenses.html">Licenses</a></div>`;

const rewrites = [
  ['"/static/', '"static/'],
  ['href="/dealers"', 'href="app/#/dealers"'],
  ['href="/login"', 'href="app/#/login"'],
  ['href="/register"', 'href="app/#/register"'],
  ['href="/about"', 'href="about.html"'],
  ['href="/contact"', 'href="contact.html"'],
  ['href="/"', 'href="index.html"'],
  ["window.location.href = window.location.origin;", 'window.location.href = "index.html";'],
];

for (const [source, target] of [["Home.html", "index.html"], ["About.html", "about.html"], ["Contact.html", "contact.html"]]) {
  let html = fs.readFileSync(path.join(staticPages, source), "utf8");
  for (const [from, to] of rewrites) html = html.split(from).join(to);
  html = html.replace(/<body([^>]*)>/, (tag) => `${tag}\n${banner}`);
  fs.writeFileSync(path.join(site, target), html);
}

for (const file of fs.readdirSync(staticPages)) {
  if (!file.endsWith(".html")) fs.copyFileSync(path.join(staticPages, file), path.join(site, "static", file));
}

// 4. Licenses of everything the demo distributes
const legal = path.join(site, "licenses");
fs.mkdirSync(legal);
fs.copyFileSync(path.resolve(frontend, "..", "..", "LICENSE"), path.join(legal, "LICENSE-project.txt"));
fs.copyFileSync(require.resolve("vader-sentiment/LICENSE"), path.join(legal, "LICENSE-vader-sentiment.txt"));
fs.copyFileSync(require.resolve("vader-sentiment/NOTICE"), path.join(legal, "NOTICE-vader-sentiment.txt"));
const jsLicenses = fs.readdirSync(path.join(site, "app", "static", "js")).find((f) => f.endsWith(".LICENSE.txt"));
fs.writeFileSync(path.join(site, "licenses.html"), `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Licenses</title>
  <link rel="stylesheet" href="static/bootstrap.min.css">
</head>
<body style="max-width: 46rem; margin: 2rem auto; padding: 0 1rem;">
  <h1>Licenses</h1>
  <p><a href="index.html">Back to the demo</a></p>
  <h2>This project</h2>
  <p>Apache License 2.0, Copyright 2020 IBM Developer Skills Network. Based on IBM Skills Network's
    capstone template and modified in 2026 by AnnaTverdovska.
    <a href="licenses/LICENSE-project.txt">License text</a>, <a href="${REPO_URL}">source code</a>.</p>
  <h2>vaderSentiment-js</h2>
  <p>Rates the reviews in this demo. Apache License 2.0, Copyright 2018 Comcast Cable Communications
    Management, LLC. This product includes software developed at Comcast (http://www.comcast.com/).
    <a href="licenses/LICENSE-vader-sentiment.txt">License text</a>, <a href="licenses/NOTICE-vader-sentiment.txt">NOTICE</a>.</p>
  <h2>Bootstrap 5.0.2</h2>
  <p>MIT License, Copyright 2011-2021 The Bootstrap Authors and Twitter, Inc. The full notice is at the top of
    <a href="static/bootstrap.min.css">static/bootstrap.min.css</a>.</p>
  <h2>React, React Router and other libraries in the app</h2>
  <p>Their license notices are collected in <a href="app/static/js/${jsLicenses}">app/static/js/${jsLicenses}</a>.</p>
</body>
</html>
`);

console.log(`Demo site written to ${site}`);
