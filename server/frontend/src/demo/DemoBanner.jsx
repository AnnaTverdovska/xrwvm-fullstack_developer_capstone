import React from "react";
import { isDemo } from "../links";

export const REPO_URL = "https://github.com/AnnaTverdovska/xrwvm-fullstack_developer_capstone";

// Shown on every page of the demo build, so nobody mistakes it for a real dealership
const DemoBanner = () => {
  if (!isDemo) return null;
  return (
    <div role="note" className="demo-note">
      Demo with sample data: "Best Cars" is fictional, and anything you add stays in this browser.{" "}
      <a href={REPO_URL}>See the code on GitHub</a>. <a href="../licenses.html">Licenses</a>
    </div>
  );
};

export default DemoBanner;
