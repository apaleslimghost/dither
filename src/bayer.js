export const bayer8 = [
	 0, 32,  8, 40,  2, 34, 10, 42,
  48, 16, 56, 24, 50, 18, 58, 26,
  12, 44,  4, 36, 14, 46,  6, 38,
  60, 28, 52, 20, 62, 30, 54, 22,
	 3, 35, 11, 43,  1, 33,  9, 41,
  51, 19, 59, 27, 49, 17, 57, 25,
  15, 47,  7, 39, 13, 45,  5, 37,
  63, 31, 55, 23, 61, 29, 53, 21,
].map(b => b / 64 - 0.5)

/** @returns{[number, number, number, number]} */
export function bayer(
  /** @type{ImageData} */ imageData,
  /** @type{number} */ index,
  /** @type{number} */ paletteSize,
  // NOTYET /** @type{number} */ level
) {
  const x = (index / 4) % imageData.width
  const y = Math.floor((index / 4) / imageData.width)
  const spread = 255 / Math.log2(paletteSize)

  const bayerFactor = bayer8[(x % 8) + 8 * (y % 8)]
  const [or, og, ob, oa] = imageData.data.slice(index, index + 4)

  return [
    or + spread * bayerFactor,
    og + spread * bayerFactor,
    ob + spread * bayerFactor,
    oa + spread * bayerFactor,
  ]
}
