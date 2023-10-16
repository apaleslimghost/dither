const worker = new Worker('/src/worker.js', {type: 'module'})

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

		worker.postMessage({ action: 'setImageData', data: imageData }, [imageData.data.buffer])

		// TODO
		setTimeout(() => {
			worker.postMessage({
				action: 'dither',
				paletteSize: 16
			})
		}, 100)

	}, {once: true})

	image.src = url
})

worker.addEventListener('message', (event) => {
	ctx.putImageData(event.data, 0, 0)
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
