// Menu button and login state for the static pages (Home, About, Contact).
// The React pages do the same in src/components/Header/Header.jsx.
document.addEventListener("DOMContentLoaded", () => {
  const nav = document.getElementById("site-nav");
  const menuButton = document.querySelector(".menu-button");
  menuButton.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    menuButton.setAttribute("aria-expanded", String(open));
  });

  const username = sessionStorage.getItem("username");
  if (username) {
    document.querySelector("[data-signed-out]").hidden = true;
    document.querySelector("[data-signed-in]").hidden = false;
    document.querySelector(".nav-user").textContent = "Signed in as " + username;
  }

  document.querySelector("[data-logout]").addEventListener("click", async (event) => {
    event.preventDefault();
    try {
      await fetch(window.location.origin + "/djangoapp/logout", { method: "GET" });
    } catch (error) {
      // Even if the server can't be reached, forget the user in this browser
    }
    ["username", "firstname", "lastname"].forEach((key) => sessionStorage.removeItem(key));
    window.location.href = document.querySelector(".brand").getAttribute("href");
  });
});
