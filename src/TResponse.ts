import { invariant } from './invariant'
import { Buildable, ResponseCode, responseNamesByCode } from './types'
import { messageForCode } from './messageForCode'

export class TResponse<T extends Record<string, any> = Record<string, any>> implements Buildable {
	constructor(public code: ResponseCode, public params?: T) {
		invariant(responseNamesByCode.hasOwnProperty(code), 'Invalid code: `%o`', code)
		this.name = responseNamesByCode[code]
	}

	public name: string

	public build = (): string => messageForCode(this.code, this.params)
}
