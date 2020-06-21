import { invariant } from './invariant'
import { CRLF } from './constants'
import { Buildable, ResponseCode, responseNamesByCode } from './types'

export class ErrorResponse implements Buildable {
	constructor(public code: ResponseCode, public message: string) {
		invariant(responseNamesByCode.hasOwnProperty(code), 'Invalid code: `%o`', code)
	}

	public build = (): string => this.code + ' ' + this.message + CRLF
}
