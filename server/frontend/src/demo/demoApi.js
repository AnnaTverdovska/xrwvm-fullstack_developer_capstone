// Browser-only stand-in for the Django API, used by the demo build on GitHub Pages.
//
// It answers the same /djangoapp/... requests as the real backend, with the same JSON:
// dealers and reviews come from the sample data shipped with the demo, and accounts and
// new reviews are kept in this browser's localStorage. Nothing is sent to any server.
// Sentiment is rated with vaderSentiment-js, the JavaScript port of the VADER analyzer
// that the Flask service uses, with the same thresholds.

// Same sample cars as djangoapp/populate.py
export const CARS = [
  ["NISSAN", "Pathfinder"], ["NISSAN", "Qashqai"], ["NISSAN", "XTRAIL"],
  ["Mercedes", "A-Class"], ["Mercedes", "C-Class"], ["Mercedes", "E-Class"],
  ["Audi", "A4"], ["Audi", "A5"], ["Audi", "A6"],
  ["Kia", "Sorrento"], ["Kia", "Carnival"], ["Kia", "Cerato"],
  ["Toyota", "Corolla"], ["Toyota", "Camry"], ["Toyota", "Kluger"],
].map(([CarMake, CarModel]) => ({ CarMake, CarModel }));

const USERS_KEY = "demo-users";
const REVIEWS_KEY = "demo-reviews";

const readStore = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch (e) {
    return fallback;
  }
};
const writeStore = (key, value) => localStorage.setItem(key, JSON.stringify(value));

export function classify(text) {
  const vader = require("vader-sentiment");
  const { compound } = vader.SentimentIntensityAnalyzer.polarity_scores(text);
  if (compound >= 0.05) return "positive";
  if (compound <= -0.05) return "negative";
  return "neutral";
}

async function hashPassword(username, password) {
  const bytes = new TextEncoder().encode(`${username}:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

// Handles one API call. Returns [jsonBody, httpStatus].
export async function handle(route, method, body, data) {
  const { dealers, reviews } = data;
  const parts = route.split("/");

  if (route === "register" && method === "POST") {
    const userName = (body.userName || "").trim();
    if (!userName || !body.password) return [{ status: 400, message: "Username and password are required" }, 400];
    const users = readStore(USERS_KEY, {});
    if (users[userName]) return [{ userName, error: "Already Registered" }, 409];
    users[userName] = {
      password: await hashPassword(userName, body.password),
      firstName: body.firstName || "",
      lastName: body.lastName || "",
    };
    writeStore(USERS_KEY, users);
    return [{ userName, status: "Authenticated" }, 200];
  }

  if (route === "login" && method === "POST") {
    const user = readStore(USERS_KEY, {})[body.userName];
    if (user && user.password === (await hashPassword(body.userName, body.password))) {
      return [{ userName: body.userName, status: "Authenticated" }, 200];
    }
    return [{ userName: body.userName, status: "Unauthenticated" }, 401];
  }

  if (route === "logout") return [{ userName: "" }, 200];

  if (route === "get_cars") return [{ CarModels: CARS }, 200];

  if (parts[0] === "get_dealers") {
    const state = parts[1];
    const list = !state || state === "All" ? dealers : dealers.filter((d) => d.state === state);
    return [{ status: 200, dealers: list }, 200];
  }

  if (parts[0] === "dealer") {
    const dealer = dealers.filter((d) => d.id === Number(parts[1]));
    if (dealer.length === 0) return [{ status: 404, message: "Dealer not found" }, 404];
    return [{ status: 200, dealer }, 200];
  }

  if (parts[0] === "reviews" && parts[1] === "dealer") {
    const id = Number(parts[2]);
    const all = [...reviews, ...readStore(REVIEWS_KEY, [])].filter((r) => r.dealership === id);
    return [{ status: 200, reviews: all.map((r) => ({ ...r, sentiment: classify(r.review) })) }, 200];
  }

  if (route === "add_review" && method === "POST") {
    if (!sessionStorage.getItem("username")) return [{ status: 401, message: "Unauthorized" }, 401];
    const required = ["dealership", "review", "purchase_date", "car_make", "car_model", "car_year"];
    if (required.some((field) => !body[field])) return [{ status: 400, message: "All details are mandatory" }, 400];
    const saved = readStore(REVIEWS_KEY, []);
    const nextId = Math.max(0, ...reviews.map((r) => r.id), ...saved.map((r) => r.id)) + 1;
    saved.push({
      ...body,
      id: nextId,
      dealership: Number(body.dealership),
      car_year: Number(body.car_year),
      name: body.name || sessionStorage.getItem("username"),
    });
    writeStore(REVIEWS_KEY, saved);
    return [{ status: 200 }, 200];
  }

  return [{ status: 404, message: "Not found" }, 404];
}

// Replaces window.fetch for /djangoapp/ requests; everything else goes to the network.
export function installDemoApi() {
  const realFetch = window.fetch.bind(window);
  let dataPromise = null;
  const loadData = () => {
    dataPromise = dataPromise || Promise.all([
      realFetch("demo-data/dealerships.json").then((r) => r.json()),
      realFetch("demo-data/reviews.json").then((r) => r.json()),
    ]).then(([d, r]) => ({ dealers: d.dealerships, reviews: r.reviews }));
    return dataPromise;
  };

  window.fetch = async (input, init = {}) => {
    const url = typeof input === "string" ? input : input.url;
    const start = url.indexOf("/djangoapp/");
    if (start === -1) return realFetch(input, init);

    const route = decodeURIComponent(url.slice(start + "/djangoapp/".length).split("?")[0]);
    const method = (init.method || "GET").toUpperCase();
    let body = {};
    try {
      body = init.body ? JSON.parse(init.body) : {};
    } catch (e) {
      return new Response(JSON.stringify({ status: 400, message: "Invalid JSON" }), { status: 400 });
    }
    const [json, status] = await handle(route, method, body, await loadData());
    return new Response(JSON.stringify(json), { status, headers: { "Content-Type": "application/json" } });
  };
}
