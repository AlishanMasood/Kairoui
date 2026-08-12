import { createElement } from "react";

export interface PackageInstallProps {
  /** Package name (e.g., "@kairoui/core"). */
  package: string;
}

/**
 * PackageInstall — renders install commands for npm and pnpm.
 */
export function PackageInstall({ package: pkg }: PackageInstallProps) {
  return createElement(
    "div",
    { "data-kui-docs": "package-install", style: { margin: "16px 0" } },
    createElement(
      "div",
      { style: { display: "flex", flexDirection: "column", gap: "8px" } },
      renderCommand("npm", `npm install ${pkg}`),
      renderCommand("pnpm", `pnpm add ${pkg}`),
    ),
  );
}

function renderCommand(label: string, command: string) {
  return createElement(
    "div",
    {
      key: label,
      style: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        fontFamily: "monospace",
        fontSize: "0.8125rem",
      },
    },
    createElement("span", { style: { minWidth: "40px", color: "#888", fontWeight: 500 } }, label),
    createElement(
      "code",
      {
        style: {
          flex: 1,
          background: "#1e1e1e",
          color: "#d4d4d4",
          padding: "6px 10px",
          borderRadius: "4px",
          userSelect: "all",
        },
      },
      command,
    ),
  );
}
