import { test, expect } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const fixtureDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures");

test.use({ baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:4350" });

test("signature image picker supports keyboard navigation and activation", async ({ page }) => {
  await page.goto("/tools/sign-pdf", { waitUntil: "domcontentloaded" });
  await page.locator('input[type="file"]').first().setInputFiles(path.join(fixtureDir, "sample-multipage.pdf"));

  const trigger = page.getByRole("button", { name: "Add Signature" });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Create Your Signature" });
  const uploadTab = dialog.getByRole("button", { name: "Upload Image" });
  await uploadTab.click();

  const picker = dialog.getByRole("button", { name: "Upload signature image" });
  await uploadTab.focus();
  await page.keyboard.press("Tab");
  await expect(picker).toBeFocused();
  await expect(dialog.locator('input[type="file"]')).toHaveAttribute("accept", "image/png,image/jpeg,image/webp");

  const enterChooser = page.waitForEvent("filechooser", { timeout: 5000 });
  await page.keyboard.press("Enter");
  await (await enterChooser).setFiles(path.join(fixtureDir, "transparent.png"));
  await expect(dialog.getByAltText("Uploaded signature")).toBeVisible();

  await dialog.getByRole("button", { name: "Remove and choose another image" }).click();
  await uploadTab.focus();
  await page.keyboard.press("Tab");
  await expect(picker).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(dialog.getByRole("button", { name: "Cancel" })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(picker).toBeFocused();

  const spaceChooser = page.waitForEvent("filechooser", { timeout: 5000 });
  await page.keyboard.press("Space");
  await (await spaceChooser).setFiles(path.join(fixtureDir, "transparent.png"));
  await expect(dialog.getByAltText("Uploaded signature")).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});
