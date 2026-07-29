import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Automatic cleanup after each test — unmounts React trees rendered during the test.
afterEach(() => {
  cleanup();
});
