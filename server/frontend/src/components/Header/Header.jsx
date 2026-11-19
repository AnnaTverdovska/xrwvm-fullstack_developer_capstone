// Modified 2026 by AnnaTverdovska. Original: IBM Skills Network capstone template (Apache License 2.0).
import React from 'react';
import "../assets/style.css";
import "../assets/bootstrap.min.css";
import DemoBanner from "../../demo/DemoBanner";
import { isDemo, pageUrl } from "../../links";

const Header = () => {
  const logout = async (e) => {
    e.preventDefault();
    const username = sessionStorage.getItem('username');
    try {
      await fetch(window.location.origin + "/djangoapp/logout", { method: "GET" });
    } catch (error) {
      // Even if the server can't be reached, forget the user in this browser
    }
    sessionStorage.removeItem('username');
    sessionStorage.removeItem('firstname');
    sessionStorage.removeItem('lastname');
    alert("Logged out " + username);
    window.location.href = pageUrl("/");
  };

  // Highlight the menu entry of the current page
  const path = isDemo ? (window.location.hash.slice(1) || "/") : window.location.pathname;
  const navClass = (href) => {
    const active = href === "/" ? path === "/" : path.startsWith(href);
    return active ? "nav-link active" : "nav-link";
  };

  // The username of the signed-in user, if any
  const currUser = sessionStorage.getItem('username');

  // Signed in: show the name and a logout link. Signed out: login and register links.
  const homePageItems = currUser ? (
    <div className="input_panel">
      <span className="username">{currUser}</span>
      <a className="nav_item" href="/djangoapp/logout" onClick={logout}>Logout</a>
    </div>
  ) : (
    <div className="input_panel">
      <a className="homepage_links" href={pageUrl("/login")}>Login</a>
      <a className="homepage_links" href={pageUrl("/register")}>Register</a>
    </div>
  );

  return (
    <div>
      <DemoBanner />
      <nav className="navbar navbar-expand-lg navbar-light" style={{ backgroundColor: "darkturquoise", height: "1in" }}>
        <div className="container-fluid">
          <h2 style={{ paddingRight: "5%" }}>Dealerships</h2>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarText" aria-controls="navbarText" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarText">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <a className={navClass("/")} style={{ fontSize: "larger" }} href={pageUrl("/")}>Home</a>
              </li>
              <li className="nav-item">
                <a className={navClass("/dealer")} style={{ fontSize: "larger" }} href={pageUrl("/dealers")}>Dealers</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" style={{ fontSize: "larger" }} href={pageUrl("/about")}>About Us</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" style={{ fontSize: "larger" }} href={pageUrl("/contact")}>Contact Us</a>
              </li>
            </ul>
            <span className="navbar-text">
              <div className="loginlink" id="loginlogout">
                {homePageItems}
              </div>
            </span>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Header;
