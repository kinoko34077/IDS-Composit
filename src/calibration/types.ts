import type { Box } from '../core/types';
import type { StructuralRole } from '../core/types';

export type AlphaMask = {
  width: number;
  height: number;
  data: readonly number[];
};

export type InkBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type Point = {
  x: number;
  y: number;
};

export type CharacterCalibration = {
  ids: string;
  character: string;
  font: string;
  slots: Box[];
  loss: number;
};

export type LayoutProfileSlot = Box & {
  role: StructuralRole;
};

export type LayoutProfile = {
  operator: string;
  slots: LayoutProfileSlot[];
  sampleCount: number;
  corpusVersion: string;
};
