import artifact from '../../data/layout-profiles/v0.2.json';
import type { LayoutProfile } from '../calibration/types';

type LayoutProfileArtifact = {
  version: string;
  profiles: Readonly<Record<string, LayoutProfile>>;
};

const typedArtifact = artifact as LayoutProfileArtifact;

/** Accepted, compact v0.2 profiles only; raw calibration evidence is not imported. */
export const DEFAULT_LAYOUT_PROFILES: Readonly<Record<string, LayoutProfile>> = typedArtifact.profiles;
