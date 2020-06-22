import type { Socket } from 'net'
import { EventEmitter } from 'events'
import { getTestLogger } from './utils'
import { invariant } from '../invariant'

const noop = (): any => {
	return
}

class MockSocket extends EventEmitter implements Pick<Socket, 'destroy' | 'setEncoding' | 'write'> {
	destroy = noop
	setEncoding = noop
	write = jest.fn()
}

jest.mock('net', () => ({
	createServer: (connectionListener?: (socket: MockSocket) => void) => {
		const mockSocket = new MockSocket()
		invariant(connectionListener, 'Missing connectionListener')
		connectionListener(mockSocket)
		return {
			listen: noop,
			on: noop,
			unref: noop
		}
	}
}))

describe('HyperdeckServer', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	it('sends output back to the ATEM', async () => {
		expect.assertions(3)

		const logger = getTestLogger()

		const server = await import('../HyperDeckServer')
		const hyperdeck = new server.HyperDeckServer('0.0.0.0', logger.logger)
		const socketEntries = Object.entries(hyperdeck['sockets'])
		expect(socketEntries.length).toBe(1)
		const hyperdeckSocket = socketEntries[0][1]
		const socket = hyperdeckSocket['socket']

		socket.emit('data', 'banana')

		hyperdeck.close()

		await new Promise((resolve) => setTimeout(() => resolve(), 500))

		expect((socket.write as jest.Mock).mock.calls).toMatchInlineSnapshot(`
		Array [
		  Array [
		    "500 connection info:
		protocol version: 1.11
		model: NodeJS HyperDeck Server Library

		",
		  ],
		  Array [
		    "108 internal error
		",
		  ],
		]
	`)

		expect(logger.getLoggedOutput()).toMatchInlineSnapshot(`
		Array [
		  Object {
		    "level": 30,
		    "msg": "connection",
		  },
		  Object {
		    "cmd": undefined,
		    "level": 30,
		    "msg": "--> send response to client",
		    "responseText": "500 connection info:
		protocol version: 1.11
		model: NodeJS HyperDeck Server Library

		",
		  },
		  Object {
		    "data": "banana",
		    "level": 30,
		    "msg": "<-- received message from client",
		  },
		  Object {
		    "cmds": Array [
		      Object {
		        "name": "banana",
		        "parameters": Object {},
		        "raw": "banana",
		      },
		    ],
		    "level": 30,
		    "msg": "parsed commands",
		  },
		  Object {
		    "cmd": Object {
		      "name": "banana",
		      "parameters": Object {},
		      "raw": "banana",
		    },
		    "level": 30,
		    "msg": "<-- banana",
		  },
		  Object {
		    "cmd": Object {
		      "name": "banana",
		      "parameters": Object {},
		      "raw": "banana",
		    },
		    "err": "Unhandled command name: \`banana\`",
		    "level": 50,
		    "msg": "unhandled command name",
		  },
		  Object {
		    "cmd": Object {
		      "name": "banana",
		      "parameters": Object {},
		      "raw": "banana",
		    },
		    "level": 50,
		    "msg": "--> send response to client",
		    "responseText": "108 internal error
		",
		  },
		]
	`)
	})
})
