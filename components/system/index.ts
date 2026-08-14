/**
 * The StyleBook component library — the single import surface the Studio
 * canvas consumes.
 *
 * Everything here is props-free where it can be and styles itself entirely
 * from CSS custom properties, never from React props. The consuming scope
 * (`[data-sb-canvas]` in Studio) defines those properties, so the *same*
 * element renders differently under a different system purely because it
 * resolves different `var(...)` values. That is what lets the default
 * showcase and the AI-generated UI be styled by one mechanism instead of two,
 * and it is why adding a colour or theme prop to any of these would be a
 * mistake — it would reintroduce exactly the per-surface branching this
 * design exists to prevent.
 *
 * There is deliberately no "group" or registry export. Components are
 * composed into real pages (components/studio/ShowcaseContent.tsx and
 * GeneratedContent.tsx), not listed as labelled specimens: a page of
 * specimens tells you the parts exist, it does not tell you whether the
 * system works.
 */
export { SaveButton, LikeButton } from "./Buttons";
export { FollowButton } from "./Cards";
export { Navbar, Tabs, Breadcrumbs } from "./Navigation";
export { ValidatedEmailField, SearchField } from "./Inputs";
export { ToastDemo } from "./Feedback";
export {
  CheckboxSet,
  RadioSet,
  Switch,
  SelectField,
  ProgressDemo,
  Tooltip,
  ModalDemo,
} from "./Controls";
export { useSystemStyles } from "./primitives";
export { SYSTEM_COMPONENT_CSS, SYSTEM_STYLE_ELEMENT_ID } from "./styles";
