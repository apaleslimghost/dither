const worker = new Worker('src/worker.js', {type: 'module'})

const input = document.getElementById('input')
const wrapper = document.getElementById('wrapper')

if(!(input instanceof HTMLInputElement) || !wrapper) {
	throw 'no'
}

input.addEventListener('change', () => {
	const canvas = document.createElement('canvas')
	wrapper.replaceChildren(canvas)

	const file = input.files[0]
	const url = URL.createObjectURL(file)
	const image = new Image()

	image.addEventListener('load', async () => {
		URL.revokeObjectURL(url)

		const aspect = image.width / image.height
		const landscape = image.width > image.height
		const width = landscape ? 800 : (800 * aspect)
		const height = landscape ? (800 / aspect) : 800

		image.width = canvas.width = width
		image.width = canvas.height = height

		const offscreen = canvas.transferControlToOffscreen()
		const bitmap = await createImageBitmap(image)

		worker.postMessage({ action: 'canvas', canvas: offscreen, bitmap, width, height }, [offscreen, bitmap])

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
