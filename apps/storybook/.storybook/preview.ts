import type { Preview } from "@storybook/react";
import { withKairoTheme } from "./with-kairo-theme";

const preview: Preview = {
  globalTypes: {
    kuiThemeMode: {
      description: "KairoUI theme mode",
      toolbar: {
        title: "Theme",
        icon: "paintbrush",
        items: [
          { value: "light", title: "Light", icon: "sun" },
          { value: "dark", title: "Dark", icon: "moon" },
          { value: "system", title: "System", icon: "browser" },
        ],
        dynamicTitle: true,
      },
    },
    kuiDensity: {
      description: "KairoUI density mode",
      toolbar: {
        title: "Density",
        icon: "component",
        items: [
          { value: "comfortable", title: "Comfortable" },
          { value: "standard", title: "Standard" },
          { value: "compact", title: "Compact" },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    kuiThemeMode: "light",
    kuiDensity: "comfortable",
  },
  decorators: [withKairoTheme],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    viewport: {
      viewports: {
        mobile: { name: "Mobile", styles: { width: "375px", height: "667px" } },
        tablet: { name: "Tablet", styles: { width: "768px", height: "1024px" } },
        desktop: { name: "Desktop", styles: { width: "1280px", height: "800px" } },
      },
    },
  },
};

export default preview;
