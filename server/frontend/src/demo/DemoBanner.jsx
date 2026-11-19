import React from "react";
import { isDemo } from "../links";

export const REPO_URL = "https://github.com/AnnaTverdovska/xrwvm-fullstack_developer_capstone";

// Shown on every page of the demo build, so nobody mistakes it for a real dealership
const DemoBanner = () => {
  if (!isDemo) return null;
  return (
    <div role="note" style={{ position: "relative", zIndex: 10, background: "#fff3cd", color: "#4d3b00", padding: "8px 16px", fontSize: "15px", textAlign: "center" }}>
      Demo with sample data: "Best Cars" is fictional, and accounts and reviews you add are saved only in this browser.
      The full app runs on Django, Express/MongoDB and a Flask service. <a href={REPO_URL}>See the code on GitHub</a>.{" "}
      <a href="../licenses.html">Licenses</a>
    </div>
  );
};

export default DemoBanner;
