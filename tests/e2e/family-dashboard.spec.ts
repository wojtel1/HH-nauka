import { expect, test, type Page } from "@playwright/test";

const demoPin = "258369";

async function chooseProfile(page: Page, profileName: string) {
  await page
    .getByRole("button", { name: new RegExp(profileName, "i") })
    .click();
}

async function setUpPinAndOpenDashboard(page: Page, profileName: string) {
  await chooseProfile(page, profileName);

  const pinInput = page.getByLabel("Sześciocyfrowy PIN profilu");
  const submitPin = page.getByRole("button", { name: "Potwierdź PIN" });

  await expect(pinInput).toBeVisible();
  await pinInput.fill(demoPin);
  await submitPin.click();

  await expect(pinInput).toBeVisible();
  await pinInput.fill(demoPin);
  await submitPin.click();

  await expect(pinInput).toBeHidden();
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  await page.goto("/");
});

test("pokazuje wyłącznie trzy rodzinne profile", async ({ page }) => {
  await expect(
    page.getByRole("heading", { name: "Wybierz profil" }),
  ).toBeVisible();

  for (const profileName of ["Wojtek", "Kasia", "Maja"]) {
    await expect(
      page.getByRole("button", { name: new RegExp(profileName, "i") }),
    ).toBeVisible();
  }
});

test("Maja ustawia PIN i otwiera prywatny dashboard", async ({ page }) => {
  await setUpPinAndOpenDashboard(page, "Maja");

  const navigation = page.getByRole("navigation").first();
  await expect(navigation).toBeVisible();
  await expect(
    navigation.getByRole("button", { name: "Pulpit" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "Aktywny profil: Maja. Przełącz profil",
    }),
  ).toBeVisible();
});

test("dashboard mieści się w dostępnym widoku", async ({ page }) => {
  await setUpPinAndOpenDashboard(page, "Wojtek");

  const overflowsHorizontally = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(overflowsHorizontally).toBe(false);
});

test("udostępnia instalowalny manifest PWA", async ({ request }) => {
  const response = await request.get("/manifest.webmanifest");

  expect(response.ok()).toBe(true);
  const manifest = (await response.json()) as {
    display?: string;
    icons?: Array<{ sizes?: string }>;
    name?: string;
    start_url?: string;
  };

  expect(manifest.name).toBeTruthy();
  expect(manifest.start_url).toBe("/");
  expect(manifest.display).toBe("standalone");
  expect(manifest.icons?.some((icon) => icon.sizes === "192x192")).toBe(true);
  expect(manifest.icons?.some((icon) => icon.sizes === "512x512")).toBe(true);
});
