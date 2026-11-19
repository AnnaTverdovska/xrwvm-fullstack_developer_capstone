// Modified 2026 by AnnaTverdovska. Original: IBM Skills Network capstone template (Apache License 2.0).
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter, HashRouter } from "react-router-dom";

// The demo on GitHub Pages has no server, so it uses hash routes (#/dealers)
// and answers the app's API calls in the browser (see src/demo/demoApi.js).
// The demo code is loaded separately, so the normal build doesn't contain it.
const isDemo = process.env.REACT_APP_DEMO === 'true';
const Router = isDemo ? HashRouter : BrowserRouter;

const render = () => {
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(
    <Router>
      <App />
    </Router>
  );
};

if (isDemo) {
  import('./demo/demoApi').then(({ installDemoApi }) => {
    installDemoApi();
    render();
  });
} else {
  render();
}
