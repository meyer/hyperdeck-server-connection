import * as DeserializedCommands from './types/DeserializedCommands'
import * as ResponseInterface from './types/ResponseInterface'
import { invariant } from './invariant'
export { DeserializedCommands, ResponseInterface }

export const CRLF = '\r\n'

export interface Hash<T> {
	[key: string]: T
}

export interface NotificationConfig {
	transport: boolean
	remote: boolean
	slot: boolean
	configuration: boolean
}

/** @deprecated Misspelt, use `NotificationConfig` instead */
export type NotififcationConfig = NotificationConfig

export interface Buildable {
	build(): string
}

export class TResponse<T extends Record<string, any> = Record<string, any>> implements Buildable {
	constructor(public code: ResponseCode, public params?: T) {
		invariant(responseNamesByCode.hasOwnProperty(code), 'Invalid code: `%o`', code)
		this.name = responseNamesByCode[code]
	}

	public name: string

	public build = (): string => messageForCode(this.code, this.params)
}

export const formatClipsGetResponse = (
	res: ResponseInterface.ClipsGet
): Record<string, string | number> => {
	const clipsCount = res.clips.length

	const response: Record<string, string | number> = {
		clipsCount
	}

	for (let idx = 0; idx < clipsCount; idx++) {
		const clip = res.clips[idx]
		const clipKey = (idx + 1).toString()
		response[clipKey] = `${clip.name} ${clip.startT} ${clip.duration}`
	}

	return response
}

export class ErrorResponse implements Buildable {
	constructor(public code: ResponseCode, public message: string) {
		invariant(responseNamesByCode.hasOwnProperty(code), 'Invalid code: `%o`', code)
	}

	public build = (): string => this.code + ' ' + this.message + CRLF
}

export interface DeserializedCommand {
	raw: string
	name: string
	parameters: Record<string, string | undefined>
}

export type ResponseCode = ErrorCode | SynchronousCode | AsynchronousCode

export enum ErrorCode {
	SyntaxError = 100,
	UnsupportedParameter = 101,
	InvalidValue = 102,
	Unsupported = 103,
	DiskFull = 104,
	NoDisk = 105,
	DiskError = 106,
	TimelineEmpty = 107,
	InternalError = 108,
	OutOfRange = 109,
	NoInput = 110,
	RemoteControlDisabled = 111,
	ConnectionRejected = 120,
	InvalidState = 150,
	InvalidCodec = 151,
	InvalidFormat = 160,
	InvalidToken = 161,
	FormatNotPrepared = 162
}

export enum SynchronousCode {
	OK = 200,
	SlotInfo = 202,
	DeviceInfo = 204,
	ClipsInfo = 205,
	DiskList = 206,
	TransportInfo = 208,
	Notify = 209,
	Remote = 210,
	Configuration = 211,
	ClipsCount = 214,
	Uptime = 215,
	FormatReady = 216
}

export enum AsynchronousCode {
	ConnectionInfo = 500,
	SlotInfo = 502,
	TransportInfo = 508,
	RemoteInfo = 510,
	ConfigurationInfo = 511
}

export enum NotifyType {
	Slot,
	Transport,
	Remote,
	Configuration
}

export enum CommandNames {
	DeviceInfoCommand = 'device info',
	DiskListCommand = 'disk list',
	PreviewCommand = 'preview',
	PlayCommand = 'play',
	PlayrangeSetCommand = 'playrange set',
	PlayrangeClearCommand = 'playrange clear',
	RecordCommand = 'record',
	StopCommand = 'stop',
	ClipsCountCommand = 'clips count',
	ClipsGetCommand = 'clips get',
	ClipsAddCommand = 'clips add',
	ClipsClearCommand = 'clips clear',
	TransportInfoCommand = 'transport info',
	SlotInfoCommand = 'slot info',
	SlotSelectCommand = 'slot select',
	NotifyCommand = 'notify',
	GoToCommand = 'goto',
	JogCommand = 'jog',
	ShuttleCommand = 'shuttle',
	RemoteCommand = 'remote',
	ConfigurationCommand = 'configuration',
	UptimeCommand = 'uptime',
	FormatCommand = 'format',
	IdentifyCommand = 'identify',
	WatchdogCommand = 'watchdog',
	PingCommand = 'ping'
}

export const responseNamesByCode: Record<ResponseCode, string> = {
	[AsynchronousCode.ConfigurationInfo]: 'configuration info',
	[AsynchronousCode.ConnectionInfo]: 'connection info',
	[AsynchronousCode.RemoteInfo]: 'remote info',
	[AsynchronousCode.SlotInfo]: CommandNames.SlotInfoCommand,
	[AsynchronousCode.TransportInfo]: CommandNames.TransportInfoCommand,
	[ErrorCode.ConnectionRejected]: 'connection rejected',
	[ErrorCode.DiskError]: 'disk error',
	[ErrorCode.DiskFull]: 'disk full',
	[ErrorCode.FormatNotPrepared]: 'format not prepared',
	[ErrorCode.InternalError]: 'internal error',
	[ErrorCode.InvalidCodec]: 'invalid codec',
	[ErrorCode.InvalidFormat]: 'invalid format',
	[ErrorCode.InvalidState]: 'invalid state',
	[ErrorCode.InvalidToken]: 'invalid token',
	[ErrorCode.InvalidValue]: 'invalid value',
	[ErrorCode.NoDisk]: 'no disk',
	[ErrorCode.NoInput]: 'no input',
	[ErrorCode.OutOfRange]: 'out of range',
	[ErrorCode.RemoteControlDisabled]: 'remote control disabled',
	[ErrorCode.SyntaxError]: 'syntax error',
	[ErrorCode.TimelineEmpty]: 'timeline empty',
	[ErrorCode.Unsupported]: 'unsupported',
	[ErrorCode.UnsupportedParameter]: 'unsupported parameter',
	[SynchronousCode.ClipsCount]: CommandNames.ClipsCountCommand,
	[SynchronousCode.ClipsInfo]: 'clips info',
	[SynchronousCode.Configuration]: CommandNames.ConfigurationCommand,
	[SynchronousCode.DeviceInfo]: CommandNames.DeviceInfoCommand,
	[SynchronousCode.DiskList]: CommandNames.DiskListCommand,
	[SynchronousCode.FormatReady]: 'format ready',
	[SynchronousCode.Notify]: CommandNames.NotifyCommand,
	[SynchronousCode.OK]: 'ok',
	[SynchronousCode.Remote]: CommandNames.RemoteCommand,
	[SynchronousCode.SlotInfo]: CommandNames.SlotInfoCommand,
	[SynchronousCode.TransportInfo]: CommandNames.TransportInfoCommand,
	[SynchronousCode.Uptime]: CommandNames.UptimeCommand
}

export class Timecode {
	constructor(hh: number, mm: number, ss: number, ff: number) {
		this._timecode = [hh, mm, ss, ff]
			.map((code) => {
				const codeInt = Math.floor(code)
				if (codeInt !== code || code < 0 || code > 99) {
					throw new Error('Timecode params must be an integer between 0 and 99')
				}
				// turn the integer into a potentially zero-prefixed string
				return (codeInt + 100).toString().slice(-2)
			})
			.join(':')
	}

	private _timecode: string

	public toString(): string {
		return this._timecode
	}
}

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

export const ParameterMap = {
	help: [],
	commands: [],
	'device info': [],
	'disk list': ['slot id'],
	quit: [],
	ping: [],
	preview: ['enable'],
	play: ['speed', 'loop', 'single clip'],
	'playrange set': ['clip id', 'in', 'out'],
	'playrange clear': [],
	record: ['name'],
	stop: [],
	'clips count': [],
	'clips get': ['clip id', 'count'],
	'clips add': ['name'],
	'clips clear': [],
	'transport info': [],
	'slot info': ['slot id'],
	'slot select': ['slot id', 'video format'],
	notify: ['remote', 'transport', 'slot', 'configuration', 'dropped frames'],
	goto: ['clip id', 'clip', 'timeline', 'timecode', 'slot id'],
	jog: ['timecode'],
	shuttle: ['speed'],
	remote: ['enable', 'override'],
	configuration: ['video input', 'audio input', 'file format'],
	uptime: [],
	format: ['prepare', 'confirm'],
	identify: ['enable'],
	watchdog: ['period']
}

export type Response =
	| Hash<string>
	| ResponseInterface.DeviceInfo
	| ResponseInterface.DiskList
	| ResponseInterface.ClipsCount
	| ResponseInterface.ClipsGet
	| ResponseInterface.TransportInfo
	| ResponseInterface.SlotInfo
	| ResponseInterface.Configuration
	| ResponseInterface.Uptime
	| ResponseInterface.Format

export enum SlotStatus {
	EMPTY = 'empty',
	MOUNTING = 'mounting',
	ERROR = 'error',
	MOUNTED = 'mounted'
}

export enum VideoFormat {
	NTSC = 'NTSC',
	PAL = 'PAL',
	NTSCp = 'NTSCp',
	PALp = 'PALp',
	_720p50 = '720p50',
	_720p5994 = '720p5994',
	_720p60 = '720p60',
	_1080p23976 = '1080p23976',
	_1080p24 = '1080p24',
	_1080p25 = '1080p25',
	_1080p2997 = '1080p2997',
	_1080p30 = '1080p30',
	_1080i50 = '1080i50',
	_1080i5994 = '1080i5994',
	_1080i60 = '1080i60',
	_4Kp23976 = '4Kp23976',
	_4Kp24 = '4Kp24',
	_4Kp25 = '4Kp25',
	_4Kp2997 = '4Kp2997',
	_4Kp30 = '4Kp30',
	_4Kp50 = '4Kp50',
	_4Kp5994 = '4Kp5994',
	_4Kp60 = '4Kp60'
}

export enum TransportStatus {
	PREVIEW = 'preview',
	STOPPED = 'stopped',
	PLAY = 'play',
	FORWARD = 'forward',
	REWIND = 'rewind',
	JOG = 'jog',
	SHUTTLE = 'shuttle',
	RECORD = 'record'
}

export enum FileFormats {
	QuickTimeUncompressed = 'QuickTimeUncompressed',
	QuickTimeProResHQ = 'QuickTimeProResHQ',
	QuickTimeProRes = 'QuickTimeProRes',
	QuickTimeProResLT = 'QuickTimeProResLT',
	QuickTimeProResProxy = 'QuickTimeProResProxy',
	QuickTimeDNxHR220 = 'QuickTimeDNxHR220',
	DNxHR220 = 'DNxHR220'
}

export enum AudioInputs {
	embedded = 'embedded',
	XLR = 'XLR',
	RCA = 'RCA'
}

export enum VideoInputs {
	SDI = 'SDI',
	HDMI = 'HDMI',
	component = 'component'
}
