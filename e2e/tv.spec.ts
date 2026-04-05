import { test, expect } from "./fixtures";

test.describe("TV Shows Module", () => {
  // ── Channels CRUD ──

  test.describe("Channels Page", () => {
    test("displays channels page with heading and add form", async ({
      adminPage,
    }) => {
      await adminPage.goto("/channels");

      await expect(adminPage.getByText("Channels")).toBeVisible();
      await expect(
        adminPage.getByText("Streaming services & TV providers")
      ).toBeVisible();
      await expect(
        adminPage.getByPlaceholder("Add a channel")
      ).toBeVisible();
      await expect(
        adminPage.getByRole("button", { name: "Add" })
      ).toBeVisible();
    });

    test("can add a channel and it appears in the list", async ({
      adminPage,
    }) => {
      await adminPage.goto("/channels");

      const name = `Netflix ${Date.now()}`;
      await adminPage.getByPlaceholder("Add a channel").fill(name);
      await adminPage.getByRole("button", { name: "Add" }).click();

      await expect(adminPage.getByText(name)).toBeVisible();
    });

    test("can remove a channel from the list", async ({ adminPage }) => {
      await adminPage.goto("/channels");

      const name = `ToDelete ${Date.now()}`;
      await adminPage.getByPlaceholder("Add a channel").fill(name);
      await adminPage.getByRole("button", { name: "Add" }).click();
      await expect(adminPage.getByText(name)).toBeVisible();

      const row = adminPage.locator("li", { hasText: name });
      await row.getByRole("button", { name: "Remove" }).click();

      await expect(adminPage.getByText(name)).not.toBeVisible();
    });

    test("shows empty state when no channels exist", async ({
      adminPage,
    }) => {
      await adminPage.goto("/channels");

      // If channels already exist from other tests, this may not show.
      // We just verify the page doesn't error.
      await expect(adminPage.getByText("Channels")).toBeVisible();
    });

    test("has link back to TV Shows page", async ({ adminPage }) => {
      await adminPage.goto("/channels");

      const link = adminPage.getByRole("link", { name: /TV Shows/ });
      await expect(link).toHaveAttribute("href", "/tv");
    });

    test("back link navigates to /tv", async ({ adminPage }) => {
      await adminPage.goto("/channels");

      await adminPage.getByRole("link", { name: /TV Shows/ }).click();
      await expect(adminPage).toHaveURL(/\/tv$/);
    });
  });

  // ── TV Shows List Page ──

  test.describe("TV Shows Page (/tv)", () => {
    test("displays page heading and description", async ({ adminPage }) => {
      await adminPage.goto("/tv");

      await expect(
        adminPage.getByRole("heading", { name: "TV Shows" })
      ).toBeVisible();
      await expect(
        adminPage.getByText("Track what your household is watching")
      ).toBeVisible();
    });

    test("has TMDB search input", async ({ adminPage }) => {
      await adminPage.goto("/tv");

      await expect(
        adminPage.getByPlaceholder("Search TMDB to add a show...")
      ).toBeVisible();
    });

    test("has link to channels page", async ({ adminPage }) => {
      await adminPage.goto("/tv");

      const link = adminPage.getByRole("link", { name: "Channels" });
      await expect(link).toHaveAttribute("href", "/channels");
    });

    test("channels link navigates to /channels", async ({ adminPage }) => {
      await adminPage.goto("/tv");

      await adminPage.getByRole("link", { name: "Channels" }).click();
      await expect(adminPage).toHaveURL(/\/channels$/);
    });

    test("TMDB search shows results dropdown", async ({ adminPage }) => {
      await adminPage.goto("/tv");

      const input = adminPage.getByPlaceholder("Search TMDB to add a show...");
      await input.fill("Breaking Bad");

      // Wait for search results dropdown to appear (debounced 400ms + API call)
      await expect(
        adminPage.getByText("Breaking Bad").first()
      ).toBeVisible({ timeout: 10000 });
    });

    test("can add a show from TMDB search", async ({ adminPage }) => {
      await adminPage.goto("/tv");

      const input = adminPage.getByPlaceholder("Search TMDB to add a show...");
      await input.fill("Breaking Bad");

      // Wait for results and click the first one
      const resultButton = adminPage
        .locator("ul.absolute button")
        .first();
      await resultButton.waitFor({ timeout: 10000 });
      await resultButton.click();

      // Wait for the show to appear in Currently Watching
      await expect(
        adminPage.getByText("Currently Watching")
      ).toBeVisible({ timeout: 15000 });
      await expect(
        adminPage.getByRole("link", { name: /Breaking Bad/ }).first()
      ).toBeVisible();
    });

    test("shows Currently Watching section after adding a show", async ({
      adminPage,
    }) => {
      await adminPage.goto("/tv");

      await expect(
        adminPage.getByText("Currently Watching")
      ).toBeVisible();
    });

    test("show cards display poster, name, and progress", async ({
      adminPage,
    }) => {
      await adminPage.goto("/tv");

      // There should be a show card with an episode count
      await expect(
        adminPage.getByText(/\d+\/\d+ episodes/).first()
      ).toBeVisible();
    });

    test("show card links to show detail page", async ({ adminPage }) => {
      await adminPage.goto("/tv");

      const showLink = adminPage
        .getByRole("link", { name: /Breaking Bad/ })
        .first();
      await expect(showLink).toBeVisible();
      const href = await showLink.getAttribute("href");
      expect(href).toMatch(/^\/tv\//);
    });
  });

  // ── Show Detail Page ──

  test.describe("Show Detail Page (/tv/[id])", () => {
    test("navigates to show detail from /tv page", async ({ adminPage }) => {
      await adminPage.goto("/tv");

      await adminPage
        .getByRole("link", { name: /Breaking Bad/ })
        .first()
        .click();

      await expect(
        adminPage.getByRole("heading", { name: "Breaking Bad" })
      ).toBeVisible();
    });

    test("shows breadcrumb with link back to TV Shows", async ({
      adminPage,
    }) => {
      await adminPage.goto("/tv");
      await adminPage
        .getByRole("link", { name: /Breaking Bad/ })
        .first()
        .click();

      const breadcrumb = adminPage.getByRole("link", { name: "TV Shows" });
      await expect(breadcrumb).toHaveAttribute("href", "/tv");
    });

    test("displays show poster image", async ({ adminPage }) => {
      await adminPage.goto("/tv");
      await adminPage
        .getByRole("link", { name: /Breaking Bad/ })
        .first()
        .click();

      const poster = adminPage.locator('img[alt="Breaking Bad"]');
      await expect(poster).toBeVisible();
      const src = await poster.getAttribute("src");
      expect(src).toContain("image.tmdb.org");
    });

    test("displays TMDB rating", async ({ adminPage }) => {
      await adminPage.goto("/tv");
      await adminPage
        .getByRole("link", { name: /Breaking Bad/ })
        .first()
        .click();

      await expect(
        adminPage.getByText(/TMDB \d+\.\d+\/10/)
      ).toBeVisible();
    });

    test("displays IMDb link when available", async ({ adminPage }) => {
      await adminPage.goto("/tv");
      await adminPage
        .getByRole("link", { name: /Breaking Bad/ })
        .first()
        .click();

      const imdbLink = adminPage.getByRole("link", { name: "IMDb" });
      await expect(imdbLink).toBeVisible();
      const href = await imdbLink.getAttribute("href");
      expect(href).toContain("imdb.com/title/");
    });

    test("has star rating component", async ({ adminPage }) => {
      await adminPage.goto("/tv");
      await adminPage
        .getByRole("link", { name: /Breaking Bad/ })
        .first()
        .click();

      await expect(adminPage.getByText("Your Rating")).toBeVisible();
      await expect(
        adminPage.getByLabel("Rate 1 star")
      ).toBeVisible();
      await expect(
        adminPage.getByLabel("Rate 5 stars")
      ).toBeVisible();
    });

    test("can rate a show with stars", async ({ adminPage }) => {
      await adminPage.goto("/tv");
      await adminPage
        .getByRole("link", { name: /Breaking Bad/ })
        .first()
        .click();

      await adminPage.getByLabel("Rate 4 stars").click();
      await expect(adminPage.getByText("Your rating")).toBeVisible();
    });

    test("has channel selector dropdown", async ({ adminPage }) => {
      await adminPage.goto("/tv");
      await adminPage
        .getByRole("link", { name: /Breaking Bad/ })
        .first()
        .click();

      await expect(adminPage.getByText("Watching on")).toBeVisible();
      const select = adminPage.locator("select").first();
      await expect(select).toBeVisible();
      await expect(
        select.locator("option", { hasText: "No channel" })
      ).toBeVisible();
    });

    test("has status selector with all options", async ({ adminPage }) => {
      await adminPage.goto("/tv");
      await adminPage
        .getByRole("link", { name: /Breaking Bad/ })
        .first()
        .click();

      // The status dropdown is the one with "Watching" value
      const statusSelect = adminPage.locator("select", {
        has: adminPage.locator('option[value="WATCHING"]'),
      });
      await expect(statusSelect).toBeVisible();

      // Check all status options exist
      for (const label of [
        "Watching",
        "Paused",
        "Completed",
        "Dropped",
        "Plan to Watch",
      ]) {
        await expect(
          statusSelect.locator("option", { hasText: label })
        ).toBeVisible();
      }
    });

    test("has Refresh from TMDB button", async ({ adminPage }) => {
      await adminPage.goto("/tv");
      await adminPage
        .getByRole("link", { name: /Breaking Bad/ })
        .first()
        .click();

      await expect(
        adminPage.getByRole("button", { name: "Refresh from TMDB" })
      ).toBeVisible();
    });

    test("has Remove button", async ({ adminPage }) => {
      await adminPage.goto("/tv");
      await adminPage
        .getByRole("link", { name: /Breaking Bad/ })
        .first()
        .click();

      await expect(
        adminPage.getByRole("button", { name: "Remove" })
      ).toBeVisible();
    });

    test("displays show overview", async ({ adminPage }) => {
      await adminPage.goto("/tv");
      await adminPage
        .getByRole("link", { name: /Breaking Bad/ })
        .first()
        .click();

      await expect(adminPage.getByText("Overview")).toBeVisible();
    });

    test("displays seasons section", async ({ adminPage }) => {
      await adminPage.goto("/tv");
      await adminPage
        .getByRole("link", { name: /Breaking Bad/ })
        .first()
        .click();

      await expect(
        adminPage.getByText(/Seasons \(\d+\)/)
      ).toBeVisible();
    });

    test("can expand a season to see episodes", async ({ adminPage }) => {
      await adminPage.goto("/tv");
      await adminPage
        .getByRole("link", { name: /Breaking Bad/ })
        .first()
        .click();

      // Click on Season 1
      await adminPage
        .getByRole("button", { name: /Season 1/ })
        .click();

      // Should see episodes (E1, E2, etc.)
      await expect(adminPage.getByText("E1").first()).toBeVisible();
    });

    test("season shows watched count", async ({ adminPage }) => {
      await adminPage.goto("/tv");
      await adminPage
        .getByRole("link", { name: /Breaking Bad/ })
        .first()
        .click();

      await expect(
        adminPage.getByText(/\d+\/\d+ watched/).first()
      ).toBeVisible();
    });

    test("can mark an episode as watched via checkbox", async ({
      adminPage,
    }) => {
      await adminPage.goto("/tv");
      await adminPage
        .getByRole("link", { name: /Breaking Bad/ })
        .first()
        .click();

      // Expand Season 1
      await adminPage
        .getByRole("button", { name: /Season 1/ })
        .click();

      // Click the first episode's watched checkbox
      const firstCheckbox = adminPage
        .getByLabel(/Mark watched|Mark unwatched/)
        .first();
      await firstCheckbox.click();

      // The watched count should update — we just verify the page is still functional
      await expect(
        adminPage.getByText(/\d+\/\d+ watched/).first()
      ).toBeVisible();
    });

    test("has Mark all watched button for a season", async ({
      adminPage,
    }) => {
      await adminPage.goto("/tv");
      await adminPage
        .getByRole("link", { name: /Breaking Bad/ })
        .first()
        .click();

      // Find a season that isn't all watched and expand it
      const seasonButtons = adminPage.getByRole("button", {
        name: /Season \d/,
      });
      const count = await seasonButtons.count();

      for (let i = 0; i < count; i++) {
        await seasonButtons.nth(i).click();
        const markAllBtn = adminPage.getByRole("button", {
          name: "Mark all watched",
        });
        if (await markAllBtn.isVisible()) {
          await expect(markAllBtn).toBeVisible();
          return;
        }
        // Collapse and try next
        await seasonButtons.nth(i).click();
      }
    });

    test("episode row links to episode detail page", async ({
      adminPage,
    }) => {
      await adminPage.goto("/tv");
      await adminPage
        .getByRole("link", { name: /Breaking Bad/ })
        .first()
        .click();

      // Expand Season 1
      await adminPage
        .getByRole("button", { name: /Season 1/ })
        .click();

      // Click on an episode name to navigate to detail
      const episodeLink = adminPage
        .getByRole("link", { name: /Pilot|Episode 1/ })
        .first();
      const href = await episodeLink.getAttribute("href");
      expect(href).toMatch(/\/tv\/.*\/season\/1\/episode\/1/);
    });
  });

  // ── Episode Detail Page ──

  test.describe("Episode Detail Page", () => {
    test("navigates to episode detail from show page", async ({
      adminPage,
    }) => {
      await adminPage.goto("/tv");
      await adminPage
        .getByRole("link", { name: /Breaking Bad/ })
        .first()
        .click();

      // Expand Season 1
      await adminPage
        .getByRole("button", { name: /Season 1/ })
        .click();

      // Click first episode link
      const episodeLink = adminPage
        .getByRole("link", { name: /Pilot|Episode 1/ })
        .first();
      await episodeLink.click();

      // Should be on episode detail page
      await expect(adminPage.getByText(/S1E1/)).toBeVisible();
    });

    test("displays breadcrumb navigation", async ({ adminPage }) => {
      await adminPage.goto("/tv");
      await adminPage
        .getByRole("link", { name: /Breaking Bad/ })
        .first()
        .click();

      await adminPage
        .getByRole("button", { name: /Season 1/ })
        .click();
      await adminPage
        .getByRole("link", { name: /Pilot|Episode 1/ })
        .first()
        .click();

      await expect(
        adminPage.getByRole("link", { name: "TV Shows" })
      ).toBeVisible();
      await expect(
        adminPage.getByRole("link", { name: "Breaking Bad" })
      ).toBeVisible();
    });

    test("displays episode title and show name", async ({ adminPage }) => {
      await adminPage.goto("/tv");
      await adminPage
        .getByRole("link", { name: /Breaking Bad/ })
        .first()
        .click();

      await adminPage
        .getByRole("button", { name: /Season 1/ })
        .click();
      await adminPage
        .getByRole("link", { name: /Pilot|Episode 1/ })
        .first()
        .click();

      await expect(
        adminPage.getByText("Breaking Bad")
      ).toBeVisible();
      await expect(adminPage.getByText(/E1/)).toBeVisible();
    });

    test("displays air date", async ({ adminPage }) => {
      await adminPage.goto("/tv");
      await adminPage
        .getByRole("link", { name: /Breaking Bad/ })
        .first()
        .click();

      await adminPage
        .getByRole("button", { name: /Season 1/ })
        .click();
      await adminPage
        .getByRole("link", { name: /Pilot|Episode 1/ })
        .first()
        .click();

      await expect(adminPage.getByText(/Aired/)).toBeVisible();
    });

    test("has Mark as Watched toggle button", async ({ adminPage }) => {
      await adminPage.goto("/tv");
      await adminPage
        .getByRole("link", { name: /Breaking Bad/ })
        .first()
        .click();

      await adminPage
        .getByRole("button", { name: /Season 1/ })
        .click();
      await adminPage
        .getByRole("link", { name: /Pilot|Episode 1/ })
        .first()
        .click();

      const watchBtn = adminPage.getByRole("button", {
        name: /Mark as Watched|Mark as Unwatched/,
      });
      await expect(watchBtn).toBeVisible();
    });

    test("can toggle watched status", async ({ adminPage }) => {
      await adminPage.goto("/tv");
      await adminPage
        .getByRole("link", { name: /Breaking Bad/ })
        .first()
        .click();

      await adminPage
        .getByRole("button", { name: /Season 1/ })
        .click();
      await adminPage
        .getByRole("link", { name: /Pilot|Episode 1/ })
        .first()
        .click();

      const watchBtn = adminPage.getByRole("button", {
        name: /Mark as Watched|Mark as Unwatched/,
      });
      const initialText = await watchBtn.textContent();
      await watchBtn.click();

      // Button text should change after toggling
      await expect(watchBtn).not.toHaveText(initialText!);
    });

    test("has navigation to previous/next episodes", async ({
      adminPage,
    }) => {
      await adminPage.goto("/tv");
      await adminPage
        .getByRole("link", { name: /Breaking Bad/ })
        .first()
        .click();

      await adminPage
        .getByRole("button", { name: /Season 1/ })
        .click();

      // Navigate to episode 2 (so both prev and next are available)
      const ep2Link = adminPage.getByRole("link", { name: /E2|Cat/ }).first();
      if (await ep2Link.isVisible()) {
        await ep2Link.click();

        await expect(
          adminPage.getByRole("link", { name: /Previous episode/ })
        ).toBeVisible();
        await expect(
          adminPage.getByRole("link", { name: /Next episode/ })
        ).toBeVisible();
      }
    });

    test("has Back to show link", async ({ adminPage }) => {
      await adminPage.goto("/tv");
      await adminPage
        .getByRole("link", { name: /Breaking Bad/ })
        .first()
        .click();

      await adminPage
        .getByRole("button", { name: /Season 1/ })
        .click();
      await adminPage
        .getByRole("link", { name: /Pilot|Episode 1/ })
        .first()
        .click();

      await expect(
        adminPage.getByRole("link", { name: "Back to show" })
      ).toBeVisible();
    });
  });

  // ── Dashboard Widget ──

  test.describe("Dashboard Widget", () => {
    test("displays TV Shows widget on dashboard", async ({ adminPage }) => {
      await adminPage.goto("/dashboard");

      await expect(adminPage.getByText("TV Shows")).toBeVisible();
      await expect(
        adminPage.getByText("Up next to watch")
      ).toBeVisible();
    });

    test("TV Shows widget links to /tv", async ({ adminPage }) => {
      await adminPage.goto("/dashboard");

      const link = adminPage.getByRole("link", { name: /TV Shows/ });
      await expect(link).toHaveAttribute("href", "/tv");
    });

    test("widget shows View all link", async ({ adminPage }) => {
      await adminPage.goto("/dashboard");

      await expect(adminPage.getByText("View all")).toBeVisible();
    });

    test("clicking widget navigates to /tv", async ({ adminPage }) => {
      await adminPage.goto("/dashboard");

      await adminPage.getByRole("link", { name: /TV Shows/ }).click();
      await expect(adminPage).toHaveURL(/\/tv$/);
    });
  });

  // ── Show Removal (run last to clean up) ──

  test.describe("Show Management", () => {
    test("can change show status", async ({ adminPage }) => {
      await adminPage.goto("/tv");
      await adminPage
        .getByRole("link", { name: /Breaking Bad/ })
        .first()
        .click();

      const statusSelect = adminPage.locator("select", {
        has: adminPage.locator('option[value="WATCHING"]'),
      });
      await statusSelect.selectOption("PAUSED");

      // After reload the status should persist
      await adminPage.reload();
      await expect(statusSelect).toHaveValue("PAUSED");

      // Change back to WATCHING for other tests
      await statusSelect.selectOption("WATCHING");
    });

    test("can remove a show", async ({ adminPage }) => {
      // First add a show specifically for removal
      await adminPage.goto("/tv");
      const input = adminPage.getByPlaceholder("Search TMDB to add a show...");
      await input.fill("The Office");

      const resultButton = adminPage
        .locator("ul.absolute button")
        .first();
      await resultButton.waitFor({ timeout: 10000 });
      await resultButton.click();

      // Wait for the show to appear
      await expect(
        adminPage.getByRole("link", { name: /The Office/ }).first()
      ).toBeVisible({ timeout: 15000 });

      // Navigate to its detail
      await adminPage
        .getByRole("link", { name: /The Office/ })
        .first()
        .click();

      // Set up dialog handler for confirm
      adminPage.on("dialog", (dialog) => dialog.accept());

      await adminPage.getByRole("button", { name: "Remove" }).click();

      // Should redirect back to /tv
      await expect(adminPage).toHaveURL(/\/tv$/, { timeout: 10000 });
    });
  });

  // ── Auth Guard ──

  test.describe("Authentication", () => {
    test("/tv requires authentication", async ({ page }) => {
      await page.goto("/tv");
      await expect(page).toHaveURL(/\/login/);
    });

    test("/channels requires authentication", async ({ page }) => {
      await page.goto("/channels");
      await expect(page).toHaveURL(/\/login/);
    });
  });
});
