/// <reference lib="webworker" />

import {luminance, srgbLinear} from './colours.js'
import {bayer} from './bayer.js'
import {propagateError} from './error-diffusion.js'
import {generatePalette, nearestColor} from './palette.js'

let /** @type{ImageData | undefined} */ imageData = undefined

function dither(
	/** @type{ImageData} */ original,
	/** @type{number} */ paletteSize,
) {
	const imageData = new ImageData(
		new Uint8ClampedArray(original.data),
		original.width,
		original.height
	)

	const palette = generatePalette(imageData.data, paletteSize)

	for(let index = 0; index < imageData.data.length; index += 4) {
		const [or, og, ob, oa] = imageData.data.slice(index, index + 4)

		const [r, g, b, a] = nearestColor(
			palette,
			bayer(
				imageData,
				index,
				paletteSize
			)
		).map(Math.round)

		const rError = or - r
		const gError = og - g
		const bError = ob - b
		const aError = oa - a

		imageData.data[index] = r
		imageData.data[index + 1] = g
		imageData.data[index + 2] = b
		imageData.data[index + 3] = 255

		propagateError(imageData, index, rError, 0)
		propagateError(imageData, index, gError, 1)
		propagateError(imageData, index, bError, 2)
		propagateError(imageData, index, aError, 3)
	}

	return imageData
}


/** @typedef {{ action: 'setImageData', data: ImageData }} ImageDataMessage */
/** @typedef {{ action: 'dither', paletteSize: number }} DitherMessage */
/** @typedef {DitherMessage | ImageDataMessage} Message */

self.addEventListener('message', (/** @type{MessageEvent<Message>} */event) => {
	switch(event.data.action) {
		case 'setImageData': {
			imageData = event.data.data
			break
		}
		case 'dither': {
			if(imageData) {
				const dithered = dither(imageData, event.data.paletteSize)

				postMessage(dithered, [dithered.data.buffer])
			} else {
				throw 'no'
			}

			break
		}
	}
})
