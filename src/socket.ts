import type { Socket } from 'net'
import { EventEmitter } from 'events'
import {
	AsynchronousCode,
	DeserializedCommand,
	ErrorCode,
	CommandNames,
	NotifyType,
	SynchronousCode,
	Buildable
} from './types'
import * as DeserializedCommands from './types/DeserializedCommands'
import { TResponse } from './TResponse'
import { MultilineParser } from './MultilineParser'
import type { Logger } from 'pino'

export class HyperDeckSocket extends EventEmitter {
	constructor(
		private socket: Socket,
		private logger: Logger,
		private receivedCommand: (cmd: DeserializedCommand) => Promise<Buildable>
	) {
		super()

		this.parser = new MultilineParser(logger)

		this.socket.setEncoding('utf-8')

		this.socket.on('data', (data: string) => {
			this.onMessage(data)
		})

		this.socket.on('error', () => {
			logger.info('error')
			this.socket.destroy()
			this.emit('disconnected')
			logger.info('disconnected')
		})

		this.sendResponse(
			new TResponse(AsynchronousCode.ConnectionInfo, {
				'protocol version': '1.11',
				model: 'NodeJS HyperDeck Server Library'
			})
		)
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
		this.logger.info({ data }, 'onMessage')

		this.lastReceivedMS = Date.now()

		const cmds = this.parser.receivedString(data)
		this.logger.info({ cmds }, 'commands')

		for (const cmd of cmds) {
			// special cases
			if (cmd.name === CommandNames.WatchdogCommand) {
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
			} else if (cmd.name === CommandNames.NotifyCommand) {
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
					this.sendResponse(new TResponse(SynchronousCode.Notify, settings), cmd)

					continue
				}
			}

			this.receivedCommand(cmd).then(
				(res) => this.sendResponse(res, cmd),
				// not implemented by client code:
				() => this.sendResponse(new TResponse(ErrorCode.Unsupported), cmd)
			)
		}
	}

	sendResponse(res: Buildable, cmd?: DeserializedCommand): void {
		const responseText = res.build()
		const txt = '--> ' + (cmd?.name || 'sendResponse')
		if (res instanceof TResponse && ErrorCode[res.code]) {
			this.logger.error({ responseText }, txt)
		} else {
			this.logger.info({ responseText }, txt)
		}
		this.socket.write(responseText)
	}

	notify(type: NotifyType, params: Record<string, string>): void {
		this.logger.info({ type, params }, 'notify')
		if (type === NotifyType.Configuration && this.notifySettings.configuration) {
			this.sendResponse(new TResponse(AsynchronousCode.ConfigurationInfo, params))
		} else if (type === NotifyType.Remote && this.notifySettings.remote) {
			this.sendResponse(new TResponse(AsynchronousCode.RemoteInfo, params))
		} else if (type === NotifyType.Slot && this.notifySettings.slot) {
			this.sendResponse(new TResponse(AsynchronousCode.SlotInfo, params))
		} else if (type === NotifyType.Transport && this.notifySettings.transport) {
			this.sendResponse(new TResponse(AsynchronousCode.TransportInfo, params))
		}
	}
}
