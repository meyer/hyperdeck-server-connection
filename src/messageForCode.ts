import { CRLF } from './constants'
import { ResponseCode, responseNamesByCode } from './types'

/** For a given code, generate the response message that will be sent to the ATEM */
export const messageForCode = (code: ResponseCode, params?: Record<string, unknown>): string => {
	const firstLine = `${code} ${responseNamesByCode[code]}`

	// bail if no params
	if (!params) {
		return firstLine + CRLF
	}

	// filter out params with null/undefined values
	const paramEntries = Object.entries(params).filter(([, value]) => value != null)

	// bail if no params after filtering
	if (paramEntries.length === 0) {
		return firstLine + CRLF
	}

	// turn the params object into a key/value
	return (
		paramEntries.reduce<string>((prev, [key, value]) => {
			let valueString: string

			if (typeof value === 'string') {
				valueString = value
			} else if (typeof value === 'boolean') {
				valueString = value ? 'true' : 'false'
			} else if (typeof value === 'number') {
				valueString = value.toString()
			} else {
				throw new Error('Unhandled value type: ' + typeof value)
			}

			// convert camelCase keys to space-separated words
			const formattedKey = key.replace(/([a-z])([A-Z]+)/, '$1 $2').toLowerCase()

			return prev + formattedKey + ': ' + valueString + CRLF
		}, firstLine + ':' + CRLF) + CRLF
	)
}
