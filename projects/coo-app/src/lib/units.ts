import type { VolumeUnit, WeightUnit, LengthUnit } from "@/types/database";

const ML_PER_OZ = 29.5735;
const G_PER_LB = 453.592;
const CM_PER_IN = 2.54;

export function mlToOz(ml: number): number {
  return ml / ML_PER_OZ;
}

export function ozToMl(oz: number): number {
  return oz * ML_PER_OZ;
}

export function formatVolume(ml: number, unit: VolumeUnit): string {
  if (unit === "oz") {
    return `${mlToOz(ml).toFixed(1)} oz`;
  }
  return `${Math.round(ml)} ml`;
}

export function toCanonicalMl(value: number, unit: VolumeUnit): number {
  return unit === "oz" ? ozToMl(value) : value;
}

export function fromCanonicalMl(ml: number, unit: VolumeUnit): number {
  return unit === "oz" ? mlToOz(ml) : ml;
}

export function formatWeight(grams: number, unit: WeightUnit): string {
  if (unit === "lb") {
    const lbs = grams / G_PER_LB;
    return `${lbs.toFixed(1)} lb`;
  }
  if (grams >= 1000) {
    return `${(grams / 1000).toFixed(1)} kg`;
  }
  return `${Math.round(grams)} g`;
}

export function formatLength(cm: number, unit: LengthUnit): string {
  if (unit === "in") {
    return `${(cm / CM_PER_IN).toFixed(1)} in`;
  }
  return `${cm.toFixed(1)} cm`;
}
