import { Socket } from 'net'
import { EventEmitter } from 'events'
import {
	TResponse,
	AsynchronousCode,
	DeserializedCommand,
	ErrorCode,
	CommandNames,
	DeserializedCommands,
	NotifyType,
	Hash,
	SynchronousCode,
	Buildable
} from './types'
import { MultilineParser } from './parser'
import type { Logger } from 'pino'

export class HyperdeckSocket extends EventEmitter {
	constructor(
		private _socket: Socket,
		private logger: Logger,
		private _receivedCommand: (cmd: DeserializedCommand) => Promise<Buildable>
	) {
		super()

		this._parser = new MultilineParser(this.logger)

		this._socket.setEncoding('utf-8')

		this._socket.on('data', (data: string) => {
			this._onMessage(data)
		})

		this._socket.on('error', () => {
			logger.info('error')
			this._socket.destroy()
			this.emit('disconnected')
			logger.info('disconnected')
		})

		this.sendResponse(
			new TResponse(AsynchronousCode.ConnectionInfo, {
				'protocol version': '1.6',
				model: 'NodeJS Hyperdeck Server Library'
			})
		)
	}

	private _parser: MultilineParser
	private _lastReceived = -1
	private _watchdogTimer: NodeJS.Timer | null = null

	private _notifySettings = {
		slot: false,
		transport: false,
		remote: false,
		configuration: false,
		'dropped frames': false // @todo: implement
	}

	private _onMessage(data: string): void {
		this.logger.debug('onMessage(%s)', data)

		this._lastReceived = Date.now()

		const cmds = this._parser.receivedString(data)
		this.logger.debug('commands:', cmds)

		for (const cmd of cmds) {
			// special cases
			if (cmd.name === CommandNames.WatchdogCommand) {
				if (this._watchdogTimer) clearInterval(this._watchdogTimer)

				const watchdogCmd = cmd as DeserializedCommands.WatchdogCommand
				if (watchdogCmd.parameters.period) {
					this._watchdogTimer = setInterval(() => {
						if (
							Date.now() - this._lastReceived >
							Number(watchdogCmd.parameters.period)
						) {
							this._socket.destroy()
							this.emit('disconnected')
							if (this._watchdogTimer) {
								clearInterval(this._watchdogTimer)
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
						if (this._notifySettings[param] !== undefined) {
							this._notifySettings[param] = notifyCmd.parameters[param] === 'true'
						}
					}
				} else {
					const settings: Hash<string> = {}
					for (const key of Object.keys(this._notifySettings) as Array<
						keyof HyperdeckSocket['_notifySettings']
					>) {
						settings[key] = this._notifySettings[key] ? 'true' : 'false'
					}
					this.sendResponse(new TResponse(SynchronousCode.Notify, settings))

					continue
				}
			}

			this._receivedCommand(cmd).then(
				(res) => {
					this.logger.info({ res }, '_receivedCommand response')
					this.sendResponse(res)
				},
				() => {
					this.logger.error({}, '_receivedCommand error response')
					// not implemented by client code:
					this.sendResponse(new TResponse(ErrorCode.Unsupported))
				}
			)
		}
	}

	sendResponse(res: Buildable): void {
		const msg = res.build()
		this._socket.write(msg)
	}

	notify(type: NotifyType, params: Hash<string>): void {
		this.logger.debug('notify:', type, params)
		if (type === NotifyType.Configuration && this._notifySettings.configuration) {
			this.sendResponse(new TResponse(AsynchronousCode.ConfigurationInfo, params))
		} else if (type === NotifyType.Remote && this._notifySettings.remote) {
			this.sendResponse(new TResponse(AsynchronousCode.RemoteInfo, params))
		} else if (type === NotifyType.Slot && this._notifySettings.slot) {
			this.sendResponse(new TResponse(AsynchronousCode.SlotInfo, params))
		} else if (type === NotifyType.Transport && this._notifySettings.transport) {
			this.sendResponse(new TResponse(AsynchronousCode.TransportInfo, params))
		}
	}
}
