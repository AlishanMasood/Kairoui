import React from "react";
import type { Decorator } from "@storybook/react";
import { KairoProvider } from "@kairoui/core";
import type { ThemeMode, DensityMode } from "@kairoui/theme";

/**
 * Storybook decorator that wraps stories in KairoProvider.
 *
 * Reads global toolbar values for theme mode and density.
 * Stories that render their own KairoProvider (e.g. theme preview stories)
 * can opt out by setting `parameters.kairoTheme.disable: true`.
 */
export const withKairoTheme: Decorator = (Story, context) => {
  // Allow stories to opt out
  const params = context.parameters as Record<string, Record<string, unknown>> | undefined;
  const disabled = params?.["kairoTheme"]?.["disable"] === true;
  if (disabled) {
    return React.createElement(Story);
  }

  const mode = (context.globals["kuiThemeMode"] ?? "light") as ThemeMode;
  const density = (context.globals["kuiDensity"] ?? "comfortable") as DensityMode;

  return React.createElement(KairoProvider, { mode, density }, React.createElement(Story));
};
