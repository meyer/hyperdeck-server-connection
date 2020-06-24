import { MultilineParser } from '../MultilineParser'
import { getTestLogger } from './utils'
import { CRLF } from '../constants'

const getParser = () => {
	const { logger, getLoggedOutput } = getTestLogger()
	const parser = new MultilineParser(logger)
	const parse = (message: string) => parser.receivedString(message)
	return { parse, getLoggedOutput }
}

describe('MultilineParser', () => {
	it('works with single commands', () => {
		const parser = getParser()
		expect(parser.parse('play')).toMatchInlineSnapshot(`
		Array [
		  Object {
		    "name": "play",
		    "parameters": Object {},
		    "raw": "play",
		  },
		]
	`)
		expect(parser.getLoggedOutput()).toEqual([])
	})

	it('works with multiple commands', () => {
		const parser = getParser()
		expect(parser.parse('play' + CRLF + 'stop' + CRLF + 'play')).toMatchInlineSnapshot(`
		Array [
		  Object {
		    "name": "play",
		    "parameters": Object {},
		    "raw": "play",
		  },
		  Object {
		    "name": "stop",
		    "parameters": Object {},
		    "raw": "stop",
		  },
		  Object {
		    "name": "play",
		    "parameters": Object {},
		    "raw": "play",
		  },
		]
	`)
		expect(parser.getLoggedOutput()).toEqual([])
	})

	it('does not validate commands with that do not have params', () => {
		const parser = getParser()
		expect(parser.parse('banana')).toMatchInlineSnapshot(`
		Array [
		  Object {
		    "name": "banana",
		    "parameters": Object {},
		    "raw": "banana",
		  },
		]
	`)
		expect(parser.getLoggedOutput()).toEqual([])
	})

	it('validates commands with params', () => {
		const parseMe = () =>
			getParser().parse(
				'notifyyyy: transporttttt: true slottttttttt: true remoteeeeee: true configurationnnn: false'
			)
		expect(parseMe).toThrowErrorMatchingInlineSnapshot(
			`"Command malformed / paramName not recognised: \`true slottttttttt\`"`
		)
	})

	it('parses valid commands with options', () => {
		const parser = getParser()
		expect(parser.parse('notify: transport: true slot: true remote: true configuration: false'))
			.toMatchInlineSnapshot(`
		Array [
		  Object {
		    "name": "notify",
		    "parameters": Object {
		      "configuration": "false",
		      "remote": "true",
		      "slot": "true",
		      "transport": "true",
		    },
		    "raw": "notify: transport: true slot: true remote: true configuration: false",
		  },
		]
  `)

		expect(parser.parse('configuration: video input: SDI audio input: XLR')).toMatchInlineSnapshot(`
		Array [
		  Object {
		    "name": "configuration",
		    "parameters": Object {
		      "audio input": "XLR",
		      "video input": "SDI",
		    },
		    "raw": "configuration: video input: SDI audio input: XLR",
		  },
		]
  `)

		expect(parser.parse('slot select: slot id: 2 video format: NTSC')).toMatchInlineSnapshot(`
		Array [
		  Object {
		    "name": "slot select",
		    "parameters": Object {
		      "slot id": "2",
		      "video format": "NTSC",
		    },
		    "raw": "slot select: slot id: 2 video format: NTSC",
		  },
		]
	`)

		expect(parser.parse('preview: enable: true')).toMatchInlineSnapshot(`
		Array [
		  Object {
		    "name": "preview",
		    "parameters": Object {
		      "enable": "true",
		    },
		    "raw": "preview: enable: true",
		  },
		]
  `)

		expect(parser.parse('play on startup: single clip: true')).toMatchInlineSnapshot(`
		Array [
		  Object {
		    "name": "play on startup",
		    "parameters": Object {
		      "single clip": "true",
		    },
		    "raw": "play on startup: single clip: true",
		  },
		]
  `)

		expect(parser.parse('clips get: clip id: example clip id')).toMatchInlineSnapshot(`
		Array [
		  Object {
		    "name": "clips get",
		    "parameters": Object {
		      "clip id": "example clip id",
		    },
		    "raw": "clips get: clip id: example clip id",
		  },
		]
  `)

		expect(parser.parse('playrange set: clip id: 12345')).toMatchInlineSnapshot(`
		Array [
		  Object {
		    "name": "playrange set",
		    "parameters": Object {
		      "clip id": "12345",
		    },
		    "raw": "playrange set: clip id: 12345",
		  },
		]
  `)

		expect(parser.parse('shuttle: speed: -1600')).toMatchInlineSnapshot(`
		Array [
		  Object {
		    "name": "shuttle",
		    "parameters": Object {
		      "speed": "-1600",
		    },
		    "raw": "shuttle: speed: -1600",
		  },
		]
  `)

		expect(parser.getLoggedOutput()).toEqual([])
	})
})
