import type { DeserializedCommand } from './types'
import { parametersByCommandName } from './constants'
import type { Logger } from 'pino'

export class MultilineParser {
	private logger: Logger
	private linesQueue: string[] = []

	constructor(logger: Logger) {
		this.logger = logger.child({ name: 'MultilineParser' })
	}

	receivedString(data: string): DeserializedCommand[] {
		const res: DeserializedCommand[] = []

		// add new lines to processing queue
		const newLines = data.split('\r\n')

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
				this.linesQueue[0].indexOf(':') === -1 ||
				(this.linesQueue.length === 1 && this.linesQueue[0].indexOf(':') > 0)
			) {
				const r = this.parseResponse(this.linesQueue.splice(0, 1))
				if (r) {
					res.push(r)
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
			if (r) res.push(r)
		}

		return res
	}

	parseResponse(lines: string[]): DeserializedCommand | null {
		lines = lines.map((l) => l.trim())

		if (lines.length === 1 && lines[0].indexOf(':') > -1) {
			const bits = lines[0].split(': ')

			const msg = bits.shift() as keyof typeof parametersByCommandName
			if (!msg) throw new Error('Unrecognised command')

			const params: Record<string, string> = {}
			const paramNames = new Set(parametersByCommandName[msg])
			let param = bits.shift()
			if (!param) throw new Error('No named parameters found')
			for (let i = 0; i < bits.length - 1; i++) {
				const bobs = bits[i].split(' ')

				let nextParam = ''
				for (let i = bobs.length - 1; i >= 0; i--) {
					nextParam = (bobs.pop() + ' ' + nextParam).trim()
					if (paramNames.has(nextParam)) {
						break
					}
				}

				if (!bobs.length) {
					throw new Error('Command malformed / paramName not recognised')
				}

				params[param] = bobs.join(' ')
				param = nextParam
			}
			params[param] = bits[bits.length - 1]

			return {
				raw: lines.join('\r\n'),
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
				raw: lines.join('\r\n'),
				name: msg,
				parameters: params
			}
			return res
		}
	}
}