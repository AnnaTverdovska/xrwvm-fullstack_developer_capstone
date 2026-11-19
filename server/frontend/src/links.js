// Page addresses for links and redirects.
//
// In the normal app, Django serves every page, so a path like "/dealers" is used as is.
// The demo build (REACT_APP_DEMO=true) is a static site on GitHub Pages: the React app
// lives in app/ and uses hash routes (app/#/dealers), and the Home, About and Contact
// pages are plain HTML files next to app/.
export const isDemo = process.env.REACT_APP_DEMO === "true";

export function pageUrl(path) {
  if (!isDemo) return path;
  if (path === "/") return "../index.html";
  if (path === "/about" || path === "/contact") return `..${path}.html`;
  return `#${path}`;
}
