import { HyperdeckSocket } from './socket'
import {
	DeserializedCommand,
	DeserializedCommands,
	Hash,
	TResponse,
	SynchronousCode,
	CommandNames,
	ErrorCode,
	NotifyType,
	ResponseInterface,
	ErrorResponse,
	Buildable
} from './types'
import { createServer, Server } from 'net'

type Handler<C extends DeserializedCommand, R extends any> = (command: C) => Promise<R>

class UnimplementedError extends Error {}

const noop = async () => {
	throw new UnimplementedError()
}

export class HyperdeckServer {
	private _sockets: { [id: string]: HyperdeckSocket } = {}
	private _server: Server

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
	onRemote: Handler<DeserializedCommands.RemoteCommand, void | Record<string, string>> = noop
	onConfiguration: Handler<
		DeserializedCommands.ConfigurationCommand,
		ResponseInterface.Configuration
	> = noop
	onUptime: Handler<DeserializedCommand, ResponseInterface.Uptime> = noop
	onFormat: Handler<DeserializedCommands.FormatCommand, ResponseInterface.Format> = noop
	onIdentify: Handler<DeserializedCommands.IdentifyCommand, void> = noop
	onWatchdog: Handler<DeserializedCommands.WatchdogCommand, void> = noop

	constructor(ip?: string) {
		this._server = createServer((socket) => {
			const socketId = Math.random().toString(35).substr(-6)
			this._sockets[socketId] = new HyperdeckSocket(socket, (cmd) =>
				this._receivedCommand(cmd)
			)
			this._sockets[socketId].on('disconnected', () => {
				delete this._sockets[socketId]
			})
		})
		this._server.on('listening', () => console.log('listening'))
		this._server.maxConnections = 1
		this._server.listen(9993, ip)
	}

	close(): void {
		this._server.unref()
	}

	notifySlot(params: Hash<string>): void {
		this._notify(NotifyType.Slot, params)
	}

	notifyTransport(params: Hash<string>): void {
		this._notify(NotifyType.Transport, params)
	}

	private _notify(type: NotifyType, params: Hash<string>): void {
		for (const id of Object.keys(this._sockets)) {
			this._sockets[id].notify(type, params)
		}
	}

	private async _receivedCommand(cmd: DeserializedCommand): Promise<Buildable> {
		try {
			if (cmd.name === CommandNames.DeviceInfoCommand) {
				const res = await this.onDeviceInfo(cmd)
				return new TResponse(SynchronousCode.DeviceInfo, res)
			}

			if (cmd.name === CommandNames.DiskListCommand) {
				const res = await this.onDiskList(cmd)
				return new TResponse(SynchronousCode.DiskList, res)
			}

			if (cmd.name === CommandNames.PreviewCommand) {
				await this.onPreview(cmd)
				return new TResponse(SynchronousCode.OK)
			}

			if (cmd.name === CommandNames.PlayCommand) {
				await this.onPlay(cmd)
				return new TResponse(SynchronousCode.OK)
			}

			if (cmd.name === CommandNames.PlayrangeSetCommand) {
				await this.onPlayrangeSet(cmd)
				return new TResponse(SynchronousCode.OK)
			}

			if (cmd.name === CommandNames.PlayrangeClearCommand) {
				await this.onPlayrangeClear(cmd)
				return new TResponse(SynchronousCode.OK)
			}

			if (cmd.name === CommandNames.RecordCommand) {
				await this.onRecord(cmd)
				return new TResponse(SynchronousCode.OK)
			}

			if (cmd.name === CommandNames.StopCommand) {
				await this.onStop(cmd)
				return new TResponse(SynchronousCode.OK)
			}

			if (cmd.name === CommandNames.ClipsCountCommand) {
				const res = await this.onClipsCount(cmd)
				return new TResponse(SynchronousCode.ClipsCount, res)
			}

			if (cmd.name === CommandNames.ClipsGetCommand) {
				const res = await this.onClipsGet(cmd)
				return new TResponse(SynchronousCode.ClipsInfo, res)
			}

			if (cmd.name === CommandNames.ClipsAddCommand) {
				await this.onClipsAdd(cmd)
				return new TResponse(SynchronousCode.OK)
			}

			if (cmd.name === CommandNames.ClipsClearCommand) {
				await this.onClipsClear(cmd)
				return new TResponse(SynchronousCode.OK)
			}

			if (cmd.name === CommandNames.TransportInfoCommand) {
				const res = await this.onTransportInfo(cmd)
				return new TResponse(SynchronousCode.TransportInfo, res)
			}

			if (cmd.name === CommandNames.SlotInfoCommand) {
				const res = await this.onSlotInfo(cmd)
				return new TResponse(SynchronousCode.SlotInfo, res)
			}

			if (cmd.name === CommandNames.SlotSelectCommand) {
				await this.onSlotSelect(cmd)
				return new TResponse(SynchronousCode.OK)
			}

			if (cmd.name === CommandNames.NotifyCommand) {
				// implemented in socket.ts
				return new TResponse(SynchronousCode.OK)
			}

			if (cmd.name === CommandNames.GoToCommand) {
				await this.onGoTo(cmd)
				return new TResponse(SynchronousCode.OK)
			}

			if (cmd.name === CommandNames.JogCommand) {
				await this.onJog(cmd)
				return new TResponse(SynchronousCode.OK)
			}

			if (cmd.name === CommandNames.ShuttleCommand) {
				await this.onShuttle(cmd)
				return new TResponse(SynchronousCode.OK)
			}

			if (cmd.name === CommandNames.RemoteCommand) {
				const res = await this.onRemote(cmd)
				if (!res) {
					return new TResponse(SynchronousCode.OK)
				}
				return new TResponse(SynchronousCode.Remote, res)
			}

			if (cmd.name === CommandNames.ConfigurationCommand) {
				const res = await this.onConfiguration(cmd)
				if (res) {
					return new TResponse(SynchronousCode.Configuration, res)
				}
				return new TResponse(SynchronousCode.OK)
			}

			if (cmd.name === CommandNames.UptimeCommand) {
				const res = await this.onUptime(cmd)
				return new TResponse(SynchronousCode.Uptime, res)
			}

			if (cmd.name === CommandNames.FormatCommand) {
				const res = await this.onFormat(cmd)
				if (res) {
					return new TResponse(SynchronousCode.FormatReady, res)
				}
				return new TResponse(SynchronousCode.OK)
			}

			if (cmd.name === CommandNames.IdentifyCommand) {
				await this.onIdentify(cmd)
				return new TResponse(SynchronousCode.OK)
			}

			if (cmd.name === CommandNames.WatchdogCommand) {
				// implemented in socket.ts
				return new TResponse(SynchronousCode.OK)
			}

			if (cmd.name === CommandNames.PingCommand) {
				// implemented in socket.ts
				return new TResponse(SynchronousCode.OK)
			}

			throw new Error('Unhandled command name: ' + cmd.name)
		} catch (err) {
			if (err instanceof UnimplementedError) {
				return new TResponse(ErrorCode.Unsupported)
			}

			if (err && typeof err.code === 'number' && ErrorCode[err.code] && err.msg) {
				return new ErrorResponse(err.code, err.msg)
			}

			return new TResponse(ErrorCode.InternalError)
		}
	}
}
