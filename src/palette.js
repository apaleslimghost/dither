import { luminance } from "./colours.js"

function greatestSpan(
	/** @type {Uint8ClampedArray} */ data,
	/** @type {Uint32Array} */ indices,
) {
	let rMin, rMax, gMin, gMax, bMin, bMax

	for(let i = 0; i < indices.length; i += 1) {
		const r = data[indices[i]]
		const g = data[indices[i] + 1]
		const b = data[indices[i] + 2]

		rMin = Math.min(r, rMin ?? Infinity)
		rMax = Math.max(r, rMax ?? -Infinity)
		gMin = Math.min(g, gMin ?? Infinity)
		gMax = Math.max(g, gMax ?? -Infinity)
		bMin = Math.min(b, bMin ?? Infinity)
		bMax = Math.max(b, bMax ?? -Infinity)
	}

	const rSpan = rMax - rMin
	const gSpan = gMax - gMin
	const bSpan = bMax - bMin

	const maxSpan = Math.max(rSpan, gSpan, bSpan)

	const channel = maxSpan === rSpan ? 0
					  : maxSpan === gSpan ? 1
					  : maxSpan === bSpan ? 2
					  : NaN

	return {channel, maxSpan}
}

export function pickPaletteColor(
	/** @type {Uint8ClampedArray} */ data,
	/** @type {Uint32Array} */ indices
) {
	const index = indices[indices.length - 1]
	return data.slice(index, index + 4)
}

export function nearestColor(
	/** @type{[number, number, number, number][]} */ palette,
	/** @type{[number, number, number, number]} */ [r,g,b,a]
) {
	const distances = palette.map(
		([pr, pg, pb, pa]) => Math.sqrt(
			(r - pr) ** 2 +
			(g - pg) ** 2 +
			(b - pb) ** 2 +
			(a - pa) ** 2
		)
	)

	const closest = Math.min(...distances)
	const index = distances.findIndex(d => d === closest)
	return palette[index]
}

function sortImageData(
	/** @type {Uint8ClampedArray} */ data,
	/** @type {Uint32Array} */ indices,
	/** @type number */ channel
) {
	indices.sort(
		(a, b) => data[a + channel] - data[b + channel]
	)
}

export function medianCut(
	/** @type {Uint8ClampedArray} */ data,
	/** @type {number} */ paletteSize,
	/** @type {Uint32Array} */ indices = Uint32Array.from({length: data.length / 4}, (_, i) => i * 4)
) {
	if(paletteSize === 1) {
		return [indices]
	}

	const {channel} = greatestSpan(data, indices)
	sortImageData(data, indices, channel)

	const lower = indices.slice(0, 4 * indices.length / 8)
	const upper = indices.slice(4 * indices.length / 8, indices.length)

	return medianCut(data, paletteSize / 2, lower).concat(medianCut(data, paletteSize / 2, upper))
}

export function generatePalette(
	/** @type {Uint8ClampedArray} */ data,
	/** @type {number} */ paletteSize,
) {
	const buckets = medianCut(data, paletteSize)
	buckets.sort((a, b) => luminance(a) - luminance(b))
	return buckets.map(bucket => pickPaletteColor(data, bucket))
}
