/**
 * / — Landing page
 *
 * Styled to match the Landing.dc.html design pulled from claude.ai/design
 * (project "Website redesign request") — see
 * components/landing/LandingExperience.tsx for the full implementation.
 */
import { LandingExperience } from "@/components/landing/LandingExperience";

import "@/app/styles/landing/globals.css";
import "@/app/styles/landing/experience.css";

export default function Home() {
  return <LandingExperience />;
}
