// Tests for the browser-only API used by the demo build
import { webcrypto } from "crypto";
import { TextEncoder } from "util";
import { CARS, classify, handle } from "./demoApi";

// jsdom has no Web Crypto or TextEncoder; Node provides both
Object.defineProperty(global, "crypto", { value: webcrypto, configurable: true });
global.TextEncoder = TextEncoder;

const data = {
  dealers: [
    { id: 1, full_name: "Holdlamis Car Dealership", state: "Texas" },
    { id: 2, full_name: "Temp Car Dealership", state: "Minnesota" },
  ],
  reviews: [{ id: 5, dealership: 2, review: "Fantastic services", name: "Berkly" }],
};

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

test("rates sentiment like the Flask service", () => {
  expect(classify("Fantastic services")).toBe("positive");
  expect(classify("The car broke down after two days and nobody helped me, terrible experience")).toBe("negative");
  expect(classify("It is a car dealership")).toBe("neutral");
});

test("register, reject a duplicate, then log in", async () => {
  const [registered] = await handle("register", "POST", { userName: "anna", password: "pw" }, data);
  expect(registered).toEqual({ userName: "anna", status: "Authenticated" });
  expect(localStorage.getItem("demo-users")).not.toContain('"pw"'); // only a hash is stored

  const [, duplicate] = await handle("register", "POST", { userName: "anna", password: "x" }, data);
  expect(duplicate).toBe(409);

  const [, wrong] = await handle("login", "POST", { userName: "anna", password: "nope" }, data);
  expect(wrong).toBe(401);
  const [ok] = await handle("login", "POST", { userName: "anna", password: "pw" }, data);
  expect(ok.status).toBe("Authenticated");
});

test("dealers: all, by state, one, unknown", async () => {
  expect((await handle("get_dealers", "GET", {}, data))[0].dealers).toHaveLength(2);
  expect((await handle("get_dealers/All", "GET", {}, data))[0].dealers).toHaveLength(2);
  expect((await handle("get_dealers/Texas", "GET", {}, data))[0].dealers).toEqual([data.dealers[0]]);
  expect((await handle("dealer/2", "GET", {}, data))[0].dealer).toEqual([data.dealers[1]]);
  expect((await handle("dealer/99", "GET", {}, data))[1]).toBe(404);
});

test("the car list matches the Django sample cars", async () => {
  const [json] = await handle("get_cars", "GET", {}, data);
  expect(json.CarModels).toBe(CARS);
  expect(CARS).toHaveLength(15);
});

test("posting a review needs a login and then shows up with its sentiment", async () => {
  const review = {
    name: "Anna T", dealership: "2", review: "Rude staff and a terrible car", purchase: true,
    purchase_date: "2024-03-01", car_make: "Audi", car_model: "A4", car_year: "2021",
  };
  expect((await handle("add_review", "POST", review, data))[1]).toBe(401);

  sessionStorage.setItem("username", "anna");
  expect((await handle("add_review", "POST", review, data))[0]).toEqual({ status: 200 });

  const [json] = await handle("reviews/dealer/2", "GET", {}, data);
  expect(json.reviews.map((r) => [r.id, r.sentiment])).toEqual([[5, "positive"], [6, "negative"]]);
  expect(json.reviews[1]).toMatchObject({ dealership: 2, car_year: 2021 });
});

test("a review with missing details is rejected", async () => {
  sessionStorage.setItem("username", "anna");
  expect((await handle("add_review", "POST", { review: "Great" }, data))[1]).toBe(400);
});
