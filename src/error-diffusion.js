
function propagateErrorToPixel(
	/** @type{ImageData} */ imageData,
	/** @type{number} */ x,
	/** @type{number} */ y,
	/** @type{number} */ dx,
	/** @type{number} */ dy,
	/** @type{number} */ error,
	/** @type{0 | 1 | 2 | 3} */ channel
) {
	const nx = x + dx
	const ny = y + dy
	const nIndex = (ny * imageData.width + nx) * 4

	if(
		nx >= 0 &&
		nx < imageData.width &&
		ny >= 0 &&
		ny < imageData.height
	) {
		imageData.data[nIndex + channel] = Math.max(
			0,
			Math.min(255, imageData.data[nIndex + channel] + error)
		)
	}
}

export function propagateError(
	/** @type{ImageData} */ imageData,
	/** @type{number} */ index,
	/** @type{number} */ error,
	/** @type{0 | 1 | 2 | 3} */ channel
) {
	const x = (index / 4) % imageData.width
	const y = Math.floor((index / 4) / imageData.width)

	///// Atkinson
	propagateErrorToPixel(imageData, x, y,  1, 0, error / 8, channel)
	propagateErrorToPixel(imageData, x, y,  2, 0, error / 8, channel)
	propagateErrorToPixel(imageData, x, y, -1, 1, error / 8, channel)
	propagateErrorToPixel(imageData, x, y,  0, 1, error / 8, channel)
	propagateErrorToPixel(imageData, x, y,  1, 1, error / 8, channel)
	propagateErrorToPixel(imageData, x, y,  0, 2, error / 8, channel)


	///// Floyd-Steinberg
	// propagateErrorToPixel(imageData, x, y,   1, 0, 7 * error / 16, channel)
	// propagateErrorToPixel(imageData, x, y,  -1, 1, 3 * error / 16, channel)
	// propagateErrorToPixel(imageData, x, y,   0, 1, 5 * error / 16, channel)
	// propagateErrorToPixel(imageData, x, y,   1, 1, 1 * error / 16, channel)
}
