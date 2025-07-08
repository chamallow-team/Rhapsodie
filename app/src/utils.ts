export function rgbArrayToHexInt(rgb: [number, number, number]): number {
  const r = Math.max(0, Math.min(255, rgb[0]));
  const g = Math.max(0, Math.min(255, rgb[1]));
  const b = Math.max(0, Math.min(255, rgb[2]));

  const rHex = r.toString(16).padStart(2, "0");
  const gHex = g.toString(16).padStart(2, "0");
  const bHex = b.toString(16).padStart(2, "0");

  const hexColorString = `${rHex}${gHex}${bHex}`;

  return parseInt(hexColorString, 16);
}
