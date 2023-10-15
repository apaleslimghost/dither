export const srgbLinear = (/** @type {number} */ c) => (
	c <= 0.04045
		? c / 12.92
		: ((c + 0.055) / 1.055) ** 2.4
)

export const luminance = (
	/** @type {number} */ r,
	/** @type {number} */ g,
	/** @type {number} */ b,
) => 0.2126 * srgbLinear(r / 255) + 0.7152 * srgbLinear(g / 255) + 0.0722 * srgbLinear(b / 255)
