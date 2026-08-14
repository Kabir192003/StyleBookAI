/**
 * The StyleBook component registry — the single import surface the Studio
 * canvas consumes.
 *
 * The canvas renders every group inside a `[data-sb-canvas]` wrapper whose
 * scoped CSS (generateExportCode's `scopeSelector` option, see
 * lib/studio/exportCode.ts, plus the role layer from
 * lib/studio/roleProperties.ts) defines the custom properties. Nothing in this
 * array is parameterised by colour, font or theme, and `Component`
 * deliberately takes no props: the *same* React element renders differently
 * under a different token scope purely because it resolves different
 * `var(...)` values. Adding a colour or theme prop to this contract would
 * reintroduce the per-theme branching this design exists to prevent, and would
 * break the promise that the AI-generated UI and the default showcase are
 * styled by exactly the same mechanism.
 *
 * Order is the canvas's default order, front-loaded with what a reviewer
 * judges a system on fastest.
 */
import type { ComponentType } from "react";
import { TypographyGroup } from "./Typography";
import { PaletteGroup } from "./Palette";
import { ButtonsGroup } from "./Buttons";
import { InputsGroup } from "./Inputs";
import { CardsGroup } from "./Cards";
import { NavigationGroup } from "./Navigation";
import { DataDisplayGroup } from "./DataDisplay";
import { FeedbackGroup } from "./Feedback";
import { ControlsGroup } from "./Controls";

export type SystemComponentGroup = {
  id: string;
  /** Human label for the group's heading in the canvas. */
  label: string;
  /** Renders the whole group. Props-free by contract — see the note above. */
  Component: ComponentType;
};

export const SYSTEM_COMPONENT_GROUPS: SystemComponentGroup[] = [
  { id: "typography", label: "Typography", Component: TypographyGroup },
  { id: "palette", label: "Palette", Component: PaletteGroup },
  { id: "buttons", label: "Buttons", Component: ButtonsGroup },
  { id: "inputs", label: "Inputs", Component: InputsGroup },
  { id: "cards", label: "Cards", Component: CardsGroup },
  { id: "navigation", label: "Navigation", Component: NavigationGroup },
  { id: "data", label: "Data", Component: DataDisplayGroup },
  { id: "feedback", label: "Feedback", Component: FeedbackGroup },
  { id: "controls", label: "Controls", Component: ControlsGroup },
];

export {
  TypographyGroup,
  PaletteGroup,
  ButtonsGroup,
  InputsGroup,
  CardsGroup,
  NavigationGroup,
  DataDisplayGroup,
  FeedbackGroup,
  ControlsGroup,
};
export { GroupShell, Specimen, useSystemStyles } from "./primitives";
export { SYSTEM_COMPONENT_CSS, SYSTEM_STYLE_ELEMENT_ID } from "./styles";
