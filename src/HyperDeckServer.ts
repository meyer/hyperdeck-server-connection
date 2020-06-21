import { HyperDeckSocket } from './socket'
import type { ReceivedCommandCallback } from './socket'
import { DeserializedCommand, SynchronousCode, CommandNames, ErrorCode, NotifyType } from './types'
import * as ResponseInterface from './types/ResponseInterface'
import * as DeserializedCommands from './types/DeserializedCommands'
import { formatClipsGetResponse } from './formatClipsGetResponse'
import { createServer, Server } from 'net'
import pino from 'pino'

type Handler<C extends DeserializedCommand, R extends any> = (command: C) => Promise<R>

class UnimplementedError extends Error {}

const noop = async () => {
	throw new UnimplementedError()
}

export class HyperDeckServer {
	private logger: pino.Logger
	private sockets: { [id: string]: HyperDeckSocket } = {}
	private server: Server

	onDeviceInfo: Handler<DeserializedCommand, ResponseInterface.DeviceInfo> = noop
	onDiskList: Handler<DeserializedCommand, ResponseInterface.DiskList> = noop
	onPreview: Handler<DeserializedCommands.PreviewCommand, void> = noop
	onPlay: Handler<DeserializedCommands.PlayCommand, void> = noop
	onPlayrangeSet: Handler<DeserializedCommands.PlayrangeSetCommand, void> = noop
	onPlayrangeClear: Handler<DeserializedCommand, void> = noop
	onRecord: Handler<DeserializedCommands.RecordCommand, void> = noop
	onStop: Handler<DeserializedCommand, void> = noop
	onClipsCount: Handler<DeserializedCommand, ResponseInterface.ClipsCount> = noop
	onClipsGet: Handler<DeserializedCommands.ClipsGetCommand, ResponseInterface.ClipsGet> = noop
	onClipsAdd: Handler<DeserializedCommands.ClipsAddCommand, void> = noop
	onClipsClear: Handler<DeserializedCommand, void> = noop
	onTransportInfo: Handler<DeserializedCommand, ResponseInterface.TransportInfo> = noop
	onSlotInfo: Handler<DeserializedCommands.SlotInfoCommand, ResponseInterface.SlotInfo> = noop
	onSlotSelect: Handler<DeserializedCommands.SlotSelectCommand, void> = noop
	onGoTo: Handler<DeserializedCommands.GoToCommand, void> = noop
	onJog: Handler<DeserializedCommands.JogCommand, void> = noop
	onShuttle: Handler<DeserializedCommands.ShuttleCommand, void> = noop
	onConfiguration: Handler<
		DeserializedCommands.ConfigurationCommand,
		ResponseInterface.Configuration
	> = noop
	onUptime: Handler<DeserializedCommand, ResponseInterface.Uptime> = noop
	onFormat: Handler<DeserializedCommands.FormatCommand, ResponseInterface.Format> = noop
	onIdentify: Handler<DeserializedCommands.IdentifyCommand, void> = noop
	onWatchdog: Handler<DeserializedCommands.WatchdogCommand, void> = noop

	constructor(ip?: string, logger = pino()) {
		this.logger = logger.child({ name: 'HyperDeck Emulator' })

		this.server = createServer((socket) => {
			this.logger.info('connection')
			const socketId = Math.random().toString(35).substr(-6)

			const socketLogger = this.logger.child({ name: 'HyperDeck socket ' + socketId })

			this.sockets[socketId] = new HyperDeckSocket(socket, socketLogger, (cmd) =>
				this.receivedCommand(cmd)
			)

			this.sockets[socketId].on('disconnected', () => {
				socketLogger.info('disconnected')
				delete this.sockets[socketId]
			})
		})

		this.server.on('listening', () => this.logger.info('listening'))
		this.server.on('close', () => this.logger.info('connection closed'))
		this.server.on('error', (err) => this.logger.error('server error:', err))
		this.server.maxConnections = 1
		this.server.listen(9993, ip)
	}

	close(): void {
		this.server.unref()
	}

	notifySlot(params: Record<string, string>): void {
		this.notify(NotifyType.Slot, params)
	}

	notifyTransport(params: Record<string, string>): void {
		this.notify(NotifyType.Transport, params)
	}

	private notify(type: NotifyType, params: Record<string, string>): void {
		for (const id of Object.keys(this.sockets)) {
			this.sockets[id].notify(type, params)
		}
	}

	private receivedCommand: ReceivedCommandCallback = async (cmd) => {
		// TODO(meyer) more sophisticated debouncing
		await new Promise((resolve) => setTimeout(() => resolve(), 200))

		this.logger.info({ cmd }, '<-- ' + cmd.name)
		try {
			if (cmd.name === CommandNames.DeviceInfoCommand) {
				const res = await this.onDeviceInfo(cmd)
				return { code: SynchronousCode.DeviceInfo, params: res }
			}

			if (cmd.name === CommandNames.DiskListCommand) {
				const res = await this.onDiskList(cmd)
				return { code: SynchronousCode.DiskList, params: res }
			}

			if (cmd.name === CommandNames.PreviewCommand) {
				await this.onPreview(cmd)
				return SynchronousCode.OK
			}

			if (cmd.name === CommandNames.PlayCommand) {
				await this.onPlay(cmd)
				return SynchronousCode.OK
			}

			if (cmd.name === CommandNames.PlayrangeSetCommand) {
				await this.onPlayrangeSet(cmd)
				return SynchronousCode.OK
			}

			if (cmd.name === CommandNames.PlayrangeClearCommand) {
				await this.onPlayrangeClear(cmd)
				return SynchronousCode.OK
			}

			if (cmd.name === CommandNames.RecordCommand) {
				await this.onRecord(cmd)
				return SynchronousCode.OK
			}

			if (cmd.name === CommandNames.StopCommand) {
				await this.onStop(cmd)
				return SynchronousCode.OK
			}

			if (cmd.name === CommandNames.ClipsCountCommand) {
				const res = await this.onClipsCount(cmd)
				return { code: SynchronousCode.ClipsCount, params: res }
			}

			if (cmd.name === CommandNames.ClipsGetCommand) {
				const res = await this.onClipsGet(cmd).then(formatClipsGetResponse)
				return { code: SynchronousCode.ClipsInfo, params: res }
			}

			if (cmd.name === CommandNames.ClipsAddCommand) {
				await this.onClipsAdd(cmd)
				return SynchronousCode.OK
			}

			if (cmd.name === CommandNames.ClipsClearCommand) {
				await this.onClipsClear(cmd)
				return SynchronousCode.OK
			}

			if (cmd.name === CommandNames.TransportInfoCommand) {
				const res = await this.onTransportInfo(cmd)
				return { code: SynchronousCode.TransportInfo, params: res }
			}

			if (cmd.name === CommandNames.SlotInfoCommand) {
				const res = await this.onSlotInfo(cmd)
				return { code: SynchronousCode.SlotInfo, params: res }
			}

			if (cmd.name === CommandNames.SlotSelectCommand) {
				await this.onSlotSelect(cmd)
				return SynchronousCode.OK
			}

			if (cmd.name === CommandNames.NotifyCommand) {
				// implemented in socket.ts
				return SynchronousCode.OK
			}

			if (cmd.name === CommandNames.GoToCommand) {
				await this.onGoTo(cmd)
				return SynchronousCode.OK
			}

			if (cmd.name === CommandNames.JogCommand) {
				await this.onJog(cmd)
				return SynchronousCode.OK
			}

			if (cmd.name === CommandNames.ShuttleCommand) {
				await this.onShuttle(cmd)
				return SynchronousCode.OK
			}

			if (cmd.name === CommandNames.RemoteCommand) {
				return {
					code: SynchronousCode.Remote,
					params: {
						enabled: true,
						override: false
					}
				}
			}

			if (cmd.name === CommandNames.ConfigurationCommand) {
				const res = await this.onConfiguration(cmd)
				if (res) {
					return { code: SynchronousCode.Configuration, params: res }
				}
				return SynchronousCode.OK
			}

			if (cmd.name === CommandNames.UptimeCommand) {
				const res = await this.onUptime(cmd)
				return { code: SynchronousCode.Uptime, params: res }
			}

			if (cmd.name === CommandNames.FormatCommand) {
				const res = await this.onFormat(cmd)
				if (res) {
					return { code: SynchronousCode.FormatReady, params: res }
				}
				return SynchronousCode.OK
			}

			if (cmd.name === CommandNames.IdentifyCommand) {
				await this.onIdentify(cmd)
				return SynchronousCode.OK
			}

			if (cmd.name === CommandNames.WatchdogCommand) {
				// implemented in socket.ts
				return SynchronousCode.OK
			}

			if (cmd.name === CommandNames.PingCommand) {
				// implemented in socket.ts
				return SynchronousCode.OK
			}

			throw new Error('Unhandled command name: ' + cmd.name)
		} catch (err) {
			if (err instanceof UnimplementedError) {
				this.logger.error({ cmd }, 'unimplemented')
				return ErrorCode.Unsupported
			}

			this.logger.error({ cmd, err: err.message }, 'unhandled command name')
			return ErrorCode.InternalError
		}
	}
}
