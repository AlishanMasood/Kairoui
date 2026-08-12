import { createComponent } from "../composition/create-component";
import { componentClass } from "../composition/class-generation";
import { visuallyHiddenStyles } from "./visually-hidden.styles";

export interface VisuallyHiddenProps {}

/**
 * VisuallyHidden — accessibility utility primitive.
 *
 * Hides content visually while keeping it accessible to screen readers.
 * Does NOT use display:none, visibility:hidden, or aria-hidden.
 *
 * Use for: skip links, form labels, live region announcements,
 * and any content that needs to be announced but not seen.
 */
export const VisuallyHidden = createComponent<VisuallyHiddenProps, "span">({
  displayName: "VisuallyHidden",
  defaultElement: "span",
  useComponent: ({ ref }) => ({
    rootProps: { ref, className: componentClass(visuallyHiddenStyles.name) },
  }),
});
