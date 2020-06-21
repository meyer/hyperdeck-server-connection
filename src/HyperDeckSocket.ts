import type { Socket } from 'net'
import { EventEmitter } from 'events'
import {
	AsynchronousCode,
	DeserializedCommand,
	ErrorCode,
	NotifyType,
	SynchronousCode,
	ResponseCode
} from './types'
import * as DeserializedCommands from './types/DeserializedCommands'
import { MultilineParser } from './MultilineParser'
import type { Logger } from 'pino'
import { messageForCode } from './messageForCode'

interface ResponseWithMessage {
	code: ErrorCode
	message: string
}

interface ResponseWithParams {
	code: ResponseCode
	params?: Record<string, any>
}

export type ReceivedCommandCallback = (
	cmd: DeserializedCommand
) => Promise<ResponseCode | ResponseWithParams | ResponseWithMessage>

export class HyperDeckSocket extends EventEmitter {
	constructor(
		private socket: Socket,
		private logger: Logger,
		private receivedCommand: ReceivedCommandCallback
	) {
		super()

		this.parser = new MultilineParser(logger)

		this.socket.setEncoding('utf-8')

		this.socket.on('data', (data: string) => {
			this.onMessage(data)
		})

		this.socket.on('error', (err) => {
			logger.info({ err }, 'error')
			this.socket.destroy()
			this.emit('disconnected')
			logger.info('manually disconnected')
		})

		this.sendResponse(AsynchronousCode.ConnectionInfo, {
			'protocol version': '1.11',
			model: 'NodeJS HyperDeck Server Library'
		})
	}

	private parser: MultilineParser
	private lastReceivedMS = -1
	private watchdogTimer: NodeJS.Timer | null = null

	private notifySettings = {
		slot: false,
		transport: false,
		remote: false,
		configuration: false,
		'dropped frames': false // @todo: implement
	}

	private onMessage(data: string): void {
		this.logger.info({ data }, '<-- received message from client')

		this.lastReceivedMS = Date.now()

		const cmds = this.parser.receivedString(data)
		this.logger.info({ cmds }, 'parsed commands')

		for (const cmd of cmds) {
			// special cases
			if (cmd.name === 'watchdog') {
				if (this.watchdogTimer) clearInterval(this.watchdogTimer)

				const watchdogCmd = cmd as DeserializedCommands.WatchdogCommand
				if (watchdogCmd.parameters.period) {
					this.watchdogTimer = setInterval(() => {
						if (
							Date.now() - this.lastReceivedMS >
							Number(watchdogCmd.parameters.period)
						) {
							this.socket.destroy()
							this.emit('disconnected')
							if (this.watchdogTimer) {
								clearInterval(this.watchdogTimer)
							}
						}
					}, Number(watchdogCmd.parameters.period) * 1000)
				}
			} else if (cmd.name === 'notify') {
				const notifyCmd = cmd as DeserializedCommands.NotifyCommand

				if (Object.keys(notifyCmd.parameters).length > 0) {
					for (const param of Object.keys(notifyCmd.parameters) as Array<
						keyof typeof notifyCmd.parameters
					>) {
						if (this.notifySettings[param] !== undefined) {
							this.notifySettings[param] = notifyCmd.parameters[param] === 'true'
						}
					}
				} else {
					const settings: Record<string, string> = {}
					for (const key of Object.keys(this.notifySettings) as Array<
						keyof HyperDeckSocket['notifySettings']
					>) {
						settings[key] = this.notifySettings[key] ? 'true' : 'false'
					}
					this.sendResponse(SynchronousCode.Notify, settings, cmd)

					continue
				}
			}

			this.receivedCommand(cmd).then(
				(codeOrObj) => {
					if (typeof codeOrObj === 'object') {
						const code = codeOrObj.code
						const paramsOrMessage =
							('params' in codeOrObj && codeOrObj.params) ||
							('message' in codeOrObj && codeOrObj.message) ||
							undefined
						return this.sendResponse(code, paramsOrMessage, cmd)
					}

					const code = codeOrObj

					if (
						typeof code === 'number' &&
						(ErrorCode[code] || SynchronousCode[code] || AsynchronousCode[code])
					) {
						return this.sendResponse(code, undefined, cmd)
					}

					this.logger.error(
						{ cmd, codeOrObj },
						'codeOrObj was neither a ResponseCode nor a response object'
					)
					this.sendResponse(ErrorCode.InternalError, undefined, cmd)
				},
				// not implemented by client code:
				() => this.sendResponse(ErrorCode.Unsupported, undefined, cmd)
			)
		}
	}

	sendResponse(
		code: ResponseCode,
		paramsOrMessage?: Record<string, unknown> | string,
		cmd?: DeserializedCommand
	): void {
		const responseText = messageForCode(code, paramsOrMessage)
		const method = ErrorCode[code] ? 'error' : 'info'
		this.logger[method]({ responseText, cmd }, '--> send response to client')
		this.socket.write(responseText)
	}

	notify(type: NotifyType, params: Record<string, string>): void {
		this.logger.info({ type, params }, 'notify')

		if (type === 'configuration' && this.notifySettings.configuration) {
			this.sendResponse(AsynchronousCode.ConfigurationInfo, params)
		} else if (type === 'remote' && this.notifySettings.remote) {
			this.sendResponse(AsynchronousCode.RemoteInfo, params)
		} else if (type === 'slot' && this.notifySettings.slot) {
			this.sendResponse(AsynchronousCode.SlotInfo, params)
		} else if (type === 'transport' && this.notifySettings.transport) {
			this.sendResponse(AsynchronousCode.TransportInfo, params)
		} else {
			this.logger.error({ type, params }, 'unhandled notify type')
		}
	}
}
