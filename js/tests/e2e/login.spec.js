import { test, expect } from "@playwright/test";

const EMAIL = process.env.E2E_USER_EMAIL || "testuser@stud.noroff.no";
const PASSWORD = process.env.TEST_USER_PASSWORD || "super-secret";

test.describe("login", () => {
  test("user can login", async ({ page }) => {
    // Mock successful login
    await page.route("**/auth/login", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          accessToken: "fake-token",
          name: "testuser",
          email: EMAIL,
        }),
      });
    });

    // maybeRefreshCredit() -> /profiles/testuser
    await page.route("**/profiles/testuser", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: { name: "testuser", email: EMAIL, credits: 1000 },
          meta: {},
        }),
      });
    });

    await page.goto("/#/login");

    await page.locator("#email").fill(EMAIL);
    await page.locator("#password").fill(PASSWORD);
    await page.getByRole("button", { name: "Login" }).click();

    // Navigates back home on success
    await expect(page).toHaveURL(/#\/?$/);

    // Auth state is stored in localStorage under "auction_auth_v2"
    const auth = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("auction_auth_v2") || "null"),
    );

    expect(auth?.token).toBe("fake-token");
    expect(auth?.user?.name).toBe("testuser");
    expect(auth?.credit).toBe(1000);
  });

  test("wrong password shows error", async ({ page }) => {
    // Mock 401 with Noroff-style error payload
    await page.route("**/auth/login", async (route) => {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({
          errors: [{ message: "Invalid email or password" }],
        }),
      });
    });

    await page.goto("/#/login");

    await page.locator("#email").fill(EMAIL);
    await page.locator("#password").fill("wrongpassword");
    await page.getByRole("button", { name: "Login" }).click();

    // login.js -> showFeedback(msg) writes into #feedbackText
    await expect(page.locator("#feedbackText")).toContainText(
      "Invalid email or password",
    );
  });
});
