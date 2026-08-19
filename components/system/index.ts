// Components here are props-free where possible and style themselves purely
// from CSS custom properties defined by the consuming [data-sb-canvas] scope —
// don't add a color/theme prop to any of these, it would reintroduce the
// per-surface branching this design exists to avoid.
//
// No "group" or registry export on purpose: components are composed into
// real pages (ShowcaseContent.tsx, GeneratedContent.tsx), not listed as
// specimens — a page of specimens proves the parts exist, not that the
// system works.
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
