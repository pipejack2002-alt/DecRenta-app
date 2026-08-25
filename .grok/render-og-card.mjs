import { readFileSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";

const bold = readFileSync("/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf").toString("base64");
const regular = readFileSync("/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf").toString("base64");
const italic = readFileSync("/usr/share/fonts/truetype/liberation/LiberationSerif-Italic.ttf").toString("base64");

let html = readFileSync("/workspace/.grok/og-card.html", "utf8");
html = html
  .replace("FONT_BOLD", `data:font/ttf;base64,${bold}`)
  .replace("FONT_REGULAR", `data:font/ttf;base64,${regular}`)
  .replace("FONT_ITALIC", `data:font/ttf;base64,${italic}`);

const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none"],
});
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  });
  await page.setContent(html, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(120);
  await page.screenshot({
    path: "/workspace/.grok/og-card-raw.png",
    type: "png",
    clip: { x: 0, y: 0, width: 1200, height: 630 },
  });
  console.log("wrote /workspace/.grok/og-card-raw.png");
} finally {
  await browser.close();
}
