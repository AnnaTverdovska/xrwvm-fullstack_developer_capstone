// The static pages (Home, About, Contact) can't import from src/, so they use a copy
// of the theme in static/theme.css. This test fails if the two copies drift apart.
import fs from "fs";
import path from "path";

test("static/theme.css is an exact copy of src/theme.css", () => {
  const source = fs.readFileSync(path.join(__dirname, "theme.css"), "utf8");
  const copy = fs.readFileSync(path.join(__dirname, "..", "static", "theme.css"), "utf8");
  expect(copy).toBe(source);
});
