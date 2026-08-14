/**
 * The Design Playground component registry — the single import surface the
 * playground canvas (P1) consumes.
 *
 * The canvas renders every group inside a `[data-pg-exp="…"]` wrapper whose
 * scoped CSS (generateExportCode's `scopeSelector` option, see
 * lib/studio/exportCode.ts) defines the custom properties differently per
 * experiment. Nothing in this array is parameterised by colour, font or
 * theme, and `Component` deliberately takes no props: the *same* React
 * element renders differently in every experiment purely because it resolves
 * different `var(...)` values. Adding a colour or theme prop to this contract
 * would reintroduce exactly the per-theme branching requirement 18 in
 * docs/DESIGN_PLAYGROUND.md exists to prevent.
 *
 * `id` values are also the strings stored in `Experiment.visibleGroups`
 * (lib/playground/types.ts), so they are persisted data — renaming one
 * invalidates saved playgrounds. Add new groups; do not rename existing ids.
 *
 * Order is the default board order, front-loaded with the components a
 * reviewer judges a palette on fastest.
 */
import type { ComponentType } from "react";
import { ButtonsGroup } from "./Buttons";
import { InputsGroup } from "./Inputs";
import { CardsGroup } from "./Cards";
import { NavigationGroup } from "./Navigation";
import { FeedbackGroup } from "./Feedback";
import { ControlsGroup } from "./Controls";

export type PlaygroundComponentGroup = {
  /** Stable, persisted id — matches `Experiment.visibleGroups` entries. */
  id: string;
  /** Human label for the group's toggle in the canvas chrome. */
  label: string;
  /** Renders the whole group. Props-free by contract — see the note above. */
  Component: ComponentType;
};

export const PLAYGROUND_COMPONENT_GROUPS: PlaygroundComponentGroup[] = [
  { id: "buttons", label: "Buttons", Component: ButtonsGroup },
  { id: "inputs", label: "Inputs", Component: InputsGroup },
  { id: "cards", label: "Cards", Component: CardsGroup },
  { id: "navigation", label: "Navigation", Component: NavigationGroup },
  { id: "feedback", label: "Feedback", Component: FeedbackGroup },
  { id: "controls", label: "Controls", Component: ControlsGroup },
];

export { ButtonsGroup, InputsGroup, CardsGroup, NavigationGroup, FeedbackGroup, ControlsGroup };
export { GroupShell, Specimen, usePlaygroundStyles } from "./primitives";
export { PLAYGROUND_COMPONENT_CSS, PLAYGROUND_STYLE_ELEMENT_ID } from "./styles";
