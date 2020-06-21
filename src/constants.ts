export const CRLF = '\r\n'

export const parametersByCommandName = {
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