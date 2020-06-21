import packlist = require('npm-packlist')
import path = require('path')

const PROJECT_ROOT = path.resolve(__dirname, '..', '..')

const legacySort = (a: string, b: string) =>
	a === 'package.json'
		? -1
		: b === 'package.json'
		? 1
		: /^node_modules/.test(a) && !/^node_modules/.test(b)
		? 1
		: /^node_modules/.test(b) && !/^node_modules/.test(a)
		? -1
		: path.dirname(a) === '.' && path.dirname(b) !== '.'
		? -1
		: path.dirname(b) === '.' && path.dirname(a) !== '.'
		? 1
		: a.localeCompare(b)

describe('npm publish', () => {
	it('only publishes the intended files', async () => {
		const publishedFiles = await packlist({ path: PROJECT_ROOT }).then(
			(fileList) =>
				'\n' +
				fileList
					.sort(legacySort)
					.map((f) => `- ${f}`)
					.join('\n') +
				'\n'
		)

		expect(publishedFiles).toMatchInlineSnapshot(`
		"
		- package.json
		- CHANGELOG.md
		- LICENSE
		- README.md
		- dist/__tests__/utils.d.ts
		- dist/__tests__/utils.d.ts.map
		- dist/constants.d.ts
		- dist/constants.d.ts.map
		- dist/formatClipsGetResponse.d.ts
		- dist/formatClipsGetResponse.d.ts.map
		- dist/hyperdeck-emulator.cjs.development.js
		- dist/hyperdeck-emulator.cjs.development.js.map
		- dist/hyperdeck-emulator.cjs.production.min.js
		- dist/hyperdeck-emulator.cjs.production.min.js.map
		- dist/hyperdeck-emulator.esm.js
		- dist/hyperdeck-emulator.esm.js.map
		- dist/HyperDeckServer.d.ts
		- dist/HyperDeckServer.d.ts.map
		- dist/HyperDeckSocket.d.ts
		- dist/HyperDeckSocket.d.ts.map
		- dist/index.d.ts
		- dist/index.d.ts.map
		- dist/index.js
		- dist/invariant.d.ts
		- dist/invariant.d.ts.map
		- dist/messageForCode.d.ts
		- dist/messageForCode.d.ts.map
		- dist/MultilineParser.d.ts
		- dist/MultilineParser.d.ts.map
		- dist/Timecode.d.ts
		- dist/Timecode.d.ts.map
		- dist/types.d.ts
		- dist/types.d.ts.map
		- dist/types/DeserializedCommands.d.ts
		- dist/types/DeserializedCommands.d.ts.map
		- dist/types/ResponseInterface.d.ts
		- dist/types/ResponseInterface.d.ts.map
		- src/__tests__/HyperDeckServer.spec.ts
		- src/__tests__/messageForCode.spec.ts
		- src/__tests__/meta.spec.ts
		- src/__tests__/MultilineParser.spec.ts
		- src/__tests__/utils.ts
		- src/constants.ts
		- src/formatClipsGetResponse.ts
		- src/HyperDeckServer.ts
		- src/index.ts
		- src/invariant.ts
		- src/messageForCode.ts
		- src/MultilineParser.ts
		- src/socket.ts
		- src/Timecode.ts
		- src/types.ts
		- src/types/DeserializedCommands.ts
		- src/types/ResponseInterface.ts
		"
	`)
	})
})
