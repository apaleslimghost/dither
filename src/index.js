import {luminance, srgbLinear} from './colours.js'
import {bayer} from './bayer.js'
import {propagateError} from './error-diffusion.js'
import {generatePalette, nearestColor} from './palette.js'

const canvas = document.getElementById('canvas')
const input = document.getElementById('input')

if(!(canvas instanceof HTMLCanvasElement)) {
	throw 'no'
}

if(!(input instanceof HTMLInputElement)) {
	throw 'no'
}

const ctx = canvas.getContext('2d')

input.addEventListener('change', () => {
	const file = input.files[0]
	const url = URL.createObjectURL(file)
	const image = new Image()

	image.addEventListener('load', () => {
		URL.revokeObjectURL(url)

		const {imageData, width, height} = resizeImageAndGetData(image)
		canvas.width = width
		canvas.height = height

		dither(
			ctx,
			imageData,
			16
		)

	}, {once: true})

	image.src = url
})

function resizeImageAndGetData(
	/** @type{HTMLImageElement} */ image
) {
	const aspect = image.width / image.height
	const landscape = image.width > image.height
	const width = landscape ? 800 : (800 * aspect)
	const height = landscape ? (800 / aspect) : 800

	console.log(
		image.width,
		image.height,
		aspect,
		landscape,
		width, height
	)

	const canvas = new OffscreenCanvas(width, height)
	const ctx = canvas.getContext('2d')

	ctx.drawImage(image, 0, 0, width, height)

	const imageData = ctx.getImageData(0, 0, width, height)

	return {
		imageData,
		width,
		height
	}
}


function dither(
	/** @type{CanvasRenderingContext2D} */ ctx,
	/** @type{ImageData} */ imageData,
	/** @type{number} */ paletteSize,
) {
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

	ctx.putImageData(imageData, 0, 0)
}
