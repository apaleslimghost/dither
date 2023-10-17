/// <reference lib="webworker" />

import {luminance, srgbLinear} from './colours.js'
import {bayer} from './bayer.js'
import {propagateError} from './error-diffusion.js'
import {generatePalette, nearestColor} from './palette.js'
import defaultParams from './params.js'

/** @typedef {Omit<DitherMessage, 'action'>} DitherParams */

let /** @type{ImageData | undefined} */ imageData = undefined
let /** @type{OffscreenCanvasRenderingContext2D | undefined} */ ctx = undefined
let /** @type{DitherParams | undefined} */ params = defaultParams

function dither(
	/** @type{ImageData} */ original,
	/** @type{DitherParams} */ {paletteSize},
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

		if(index % imageData.width === 0) {
			ctx.putImageData(imageData, 0, 0)
			ctx.commit()
		}
	}

	return imageData
}


/** @typedef {{ action: 'canvas', canvas: OffscreenCanvas, bitmap: ImageBitmap, width: number, height: number }} CanvasMessage */
/** @typedef {{ action: 'setDitherParams', paletteSize: number }} DitherMessage */
/** @typedef { DitherMessage | CanvasMessage } Message */

self.addEventListener('message', (/** @type{MessageEvent<Message>} */event) => {
	switch(event.data.action) {
		case 'canvas': {
			const { canvas, bitmap, width, height } = event.data
			ctx = canvas.getContext('2d')
			ctx.drawImage(bitmap, 0, 0, width, height)
			imageData = ctx.getImageData(0, 0, width, height)
			dither(imageData, params)
			break
		}
		case 'setDitherParams': {
			params = event.data

			if(imageData) {
				dither(imageData, params)
			}

			break
		}
	}
})
