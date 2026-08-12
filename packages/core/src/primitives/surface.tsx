import { createComponent } from "../composition/create-component";
import { componentClass } from "../composition/class-generation";
import { surfaceStyles } from "./surface.styles";

export type SurfaceElevation = "none" | "sm" | "md" | "lg";
export type SurfaceRadius = "none" | "sm" | "md" | "lg" | "full";

export interface SurfaceProps {
  /** Elevation level (box-shadow). */
  elevation?: SurfaceElevation;
  /** Border radius preset. */
  radius?: SurfaceRadius;
  /** Show border. Set to false to remove the default border. */
  bordered?: boolean;
}

const ELEVATION_MAP: Record<SurfaceElevation, string> = {
  none: "none",
  sm: "var(--kui-shadow-sm, 0 1px 2px rgba(0,0,0,0.05))",
  md: "var(--kui-shadow-md, 0 2px 8px rgba(0,0,0,0.08))",
  lg: "var(--kui-shadow-lg, 0 4px 16px rgba(0,0,0,0.12))",
};

const RADIUS_MAP: Record<SurfaceRadius, string> = {
  none: "0",
  sm: "var(--kui-border-radius-sm, 4px)",
  md: "var(--kui-border-radius-md, 8px)",
  lg: "var(--kui-border-radius-lg, 12px)",
  full: "9999px",
};

const CONSUMED_PROPS: readonly string[] = ["elevation", "radius", "bordered"];

/**
 * Surface — visual container primitive.
 *
 * A non-interactive panel with background, border, elevation, and radius.
 * Uses semantic tokens that respond to theme/mode changes automatically.
 */
export const Surface = createComponent<SurfaceProps, "div">({
  displayName: "Surface",
  defaultElement: "div",
  useComponent: ({ props, ref }) => {
    const { elevation, radius, bordered } = props;

    const style: Record<string, string | undefined> = {};
    if (elevation) style["boxShadow"] = ELEVATION_MAP[elevation];
    if (radius) style["borderRadius"] = RADIUS_MAP[radius];
    if (bordered === false) style["border"] = "none";

    return {
      rootProps: { ref, className: componentClass(surfaceStyles.name), style },
      consumedProps: CONSUMED_PROPS,
    };
  },
});
