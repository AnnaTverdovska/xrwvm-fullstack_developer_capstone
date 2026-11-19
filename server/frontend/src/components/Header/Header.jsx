// Modified 2026 by AnnaTverdovska. Original: IBM Skills Network capstone template (Apache License 2.0).
import React, { useState } from 'react';
import DemoBanner from "../../demo/DemoBanner";
import { isDemo, pageUrl } from "../../links";

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const logout = async (e) => {
    e.preventDefault();
    try {
      await fetch(window.location.origin + "/djangoapp/logout", { method: "GET" });
    } catch (error) {
      // Even if the server can't be reached, forget the user in this browser
    }
    sessionStorage.removeItem('username');
    sessionStorage.removeItem('firstname');
    sessionStorage.removeItem('lastname');
    window.location.href = pageUrl("/");
  };

  // Mark the menu entry of the current page
  const path = isDemo ? (window.location.hash.slice(1) || "/") : window.location.pathname;
  const current = (prefix) => (path.startsWith(prefix) ? "page" : undefined);

  // The username of the signed-in user, if any
  const currUser = sessionStorage.getItem('username');

  return (
    <header>
      <DemoBanner />
      <div className="signbar">
        <div className="signbar-inner">
          <a className="brand" href={pageUrl("/")}>Best Cars</a>
          <button
            type="button"
            className="menu-button"
            aria-expanded={menuOpen}
            aria-controls="site-nav"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            Menu
          </button>
          <nav id="site-nav" className={menuOpen ? "nav is-open" : "nav"} aria-label="Main">
            <ul className="nav-links">
              <li><a href={pageUrl("/dealers")} aria-current={current("/dealer")}>Dealers</a></li>
              <li><a href={pageUrl("/about")}>About us</a></li>
              <li><a href={pageUrl("/contact")}>Contact</a></li>
            </ul>
            <ul className="nav-account">
              {currUser ? (
                <>
                  <li><span className="nav-user">Signed in as {currUser}</span></li>
                  <li><a href="/djangoapp/logout" onClick={logout}>Log out</a></li>
                </>
              ) : (
                <>
                  <li><a href={pageUrl("/login")} aria-current={current("/login")}>Log in</a></li>
                  <li><a href={pageUrl("/register")} aria-current={current("/register")}>Register</a></li>
                </>
              )}
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
