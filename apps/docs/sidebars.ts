import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebars: SidebarsConfig = {
  docs: [
    "index",
    {
      type: "category",
      label: "Getting Started",
      items: ["getting-started/installation", "getting-started/quick-start"],
    },
    {
      type: "category",
      label: "Architecture",
      items: ["architecture/overview", "architecture/packages"],
    },
    {
      type: "category",
      label: "Tokens",
      items: ["tokens/overview"],
    },
    {
      type: "category",
      label: "Components",
      items: ["components/overview"],
    },
    {
      type: "category",
      label: "Contributing",
      items: ["contributing/guide", "contributing/development"],
    },
  ],
};

export default sidebars;
