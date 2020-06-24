import type { DeserializedCommand } from './types'
import { parametersByCommandName, CRLF } from './constants'
import type { Logger } from 'pino'
import { invariant } from './invariant'

export class MultilineParser {
	private logger: Logger
	private linesQueue: string[] = []

	constructor(logger: Logger) {
		this.logger = logger.child({ name: 'MultilineParser' })
	}

	public receivedString(data: string): DeserializedCommand[] {
		const res: DeserializedCommand[] = []

		// add new lines to processing queue
		const newLines = data.split(CRLF)

		// remove the blank line at the end from the intentionally trailing \r\n
		if (newLines.length > 0 && newLines[newLines.length - 1] === '') newLines.pop()

		this.linesQueue = this.linesQueue.concat(newLines)

		while (this.linesQueue.length > 0) {
			// skip any blank lines
			if (this.linesQueue[0] === '') {
				this.linesQueue.shift()
				continue
			}

			// if the first line has no colon, then it is a single line command
			if (
				!this.linesQueue[0].includes(':') ||
				(this.linesQueue.length === 1 && this.linesQueue[0].includes(':'))
			) {
				const parsedResponse = this.parseResponse(this.linesQueue.splice(0, 1))
				if (parsedResponse) {
					res.push(parsedResponse)
				}
				continue
			}

			const endLine = this.linesQueue.indexOf('')
			if (endLine === -1) {
				// Not got full response yet
				break
			}

			const lines = this.linesQueue.splice(0, endLine + 1)
			const r = this.parseResponse(lines)
			if (r) {
				res.push(r)
			}
		}

		return res
	}

	private parseResponse(responseLines: string[]): DeserializedCommand | null {
		const lines = responseLines.map((l) => l.trim())

		if (lines.length === 1 && lines[0].includes(':')) {
			const bits = lines[0].split(': ')

			const msg = bits.shift() as keyof typeof parametersByCommandName
			invariant(msg, 'Unrecognised command')

			const params: Record<string, string> = {}
			const paramNames = new Set(parametersByCommandName[msg])
			let param = bits.shift()
			invariant(param, 'No named parameters found')

			for (let i = 0; i < bits.length - 1; i++) {
				const bit = bits[i]
				const bobs = bit.split(' ')

				let nextParam = ''
				for (let i = bobs.length - 1; i >= 0; i--) {
					nextParam = (bobs.pop() + ' ' + nextParam).trim()
					if (paramNames.has(nextParam)) {
						break
					}
				}

				invariant(bobs.length > 0, 'Command malformed / paramName not recognised: `%s`', bit)

				params[param] = bobs.join(' ')
				param = nextParam
			}

			params[param] = bits[bits.length - 1]

			return {
				raw: lines.join(CRLF),
				name: msg,
				parameters: params
			}
		} else {
			const headerMatch = lines[0].match(/(.+?)(:|)$/im)
			if (!headerMatch) {
				this.logger.error({ header: lines[0] }, 'failed to parse header')
				return null
			}

			const msg = headerMatch[1]

			const params: Record<string, string> = {}

			for (let i = 1; i < lines.length; i++) {
				const lineMatch = lines[i].match(/^(.*?): (.*)$/im)
				if (!lineMatch) {
					this.logger.error({ line: lines[i] }, 'failed to parse line')
					continue
				}

				params[lineMatch[1]] = lineMatch[2]
			}

			const res: DeserializedCommand = {
				raw: lines.join(CRLF),
				name: msg,
				parameters: params
			}
			return res
		}
	}
}
