import { invariant } from './invariant'

export class Timecode {
	constructor(hh: number, mm: number, ss: number, ff: number) {
		const timecode = [hh, mm, ss, ff]
			.map((code) => {
				const codeInt = Math.floor(code)
				invariant(
					codeInt === code && code >= 0 && code <= 99,
					'Timecode params must be an integer between 0 and 99'
				)

				// turn the integer into a potentially zero-prefixed string
				return (codeInt + 100).toString().slice(-2)
			})
			.join(':')

		this.toString = () => timecode
	}

	public toString: () => string
}
