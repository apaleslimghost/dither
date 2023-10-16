const worker = new Worker('src/worker.js', {type: 'module'})

const input = document.getElementById('input')
const wrapper = document.getElementById('wrapper')

if(!(input instanceof HTMLInputElement) || !wrapper) {
	throw 'no'
}

input.addEventListener('change', () => {
	const canvas = document.createElement('canvas')
	const ctx = canvas.getContext('2d')
	wrapper.replaceChildren(canvas)

	const file = input.files[0]
	const url = URL.createObjectURL(file)
	const image = new Image()

	image.addEventListener('load', () => {
		URL.revokeObjectURL(url)

		const aspect = image.width / image.height
		const landscape = image.width > image.height
		const width = landscape ? 800 : (800 * aspect)
		const height = landscape ? (800 / aspect) : 800

		canvas.width = width
		canvas.height = height

		ctx.drawImage(image, 0, 0, image.width, image.height, 0, 0, width, height)

		const imageData = ctx.getImageData(0, 0, width, height)

		worker.postMessage({ action: 'setImageData', data: imageData }, [imageData.data.buffer])

		// TODO
		setTimeout(() => {
			worker.postMessage({
				action: 'dither',
				paletteSize: 16
			})
		}, 100)

		worker.addEventListener('message', event => ctx.putImageData(event.data, 0, 0), {once: true})

	}, {once: true})

	image.src = url
})
