// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import { UpdateControl } from "../components/pwa/UpdateControl";
import { Brand, PageTitle } from "../components/ui/Identity";
const sw = new EventTarget();
const reg = {
  update: vi.fn().mockResolvedValue(undefined),
  installing: null,
  waiting: null,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
};
Object.assign(sw, {
  register: vi.fn().mockResolvedValue(reg),
  getRegistration: vi.fn().mockResolvedValue(reg),
  controller: {},
});
beforeEach(() => {
  Object.assign(sw, {
    register: vi.fn().mockResolvedValue(reg),
    getRegistration: vi.fn().mockResolvedValue(reg),
  });
  reg.update.mockResolvedValue(undefined);
  vi.stubEnv("DEV", false);
  Object.defineProperty(navigator, "serviceWorker", {
    configurable: true,
    value: sw,
  });
  Object.defineProperty(navigator, "onLine", {
    configurable: true,
    value: true,
  });
  vi.clearAllMocks();
});
afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});
it("preserves semantic heading and identity", () => {
  render(
    <>
      <Brand />
      <PageTitle>Training</PageTitle>
    </>,
  );
  expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
    "Training",
  );
  expect(screen.getByText("PRECISION IN EVERY REP.")).toBeTruthy();
});
it("offers an explicit reload on controller change, without automatically reloading", async () => {
  render(<UpdateControl compact />);
  await waitFor(() => expect(reg.addEventListener).toHaveBeenCalled());
  expect(screen.queryByText("Update öffnen")).toBeNull();
  act(() => {
    sw.dispatchEvent(new Event("controllerchange"));
  });
  expect(await screen.findByText("Update öffnen")).toBeTruthy();
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
  fireEvent.click(screen.getByText("Update öffnen"));
  expect(confirm).toHaveBeenCalled();
  expect(sw).toBeTruthy();
  expect(screen.getByText("Update öffnen")).toBeTruthy();
});
it("reports offline checks without touching stored training", async () => {
  render(<UpdateControl />);
  await waitFor(() => expect(reg.addEventListener).toHaveBeenCalled());
  Object.defineProperty(navigator, "onLine", {
    configurable: true,
    value: false,
  });
  const before = reg.update.mock.calls.length;
  fireEvent.click(screen.getByText("Auf Updates prüfen"));
  expect(screen.getByRole("status").textContent).toContain("Offline");
  expect(reg.update.mock.calls.length).toBe(before);
});
it("removes update listeners when unmounted", async () => {
  const remove = vi.spyOn(sw, "removeEventListener");
  const view = render(<UpdateControl />);
  await waitFor(() => expect(reg.addEventListener).toHaveBeenCalled());
  view.unmount();
  expect(remove).toHaveBeenCalledWith("controllerchange", expect.any(Function));
  expect(reg.removeEventListener).toHaveBeenCalledWith(
    "updatefound",
    expect.any(Function),
  );
});
