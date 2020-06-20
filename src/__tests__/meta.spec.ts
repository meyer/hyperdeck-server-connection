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
		- dist/hyperdeck-server-connection.cjs.development.js
		- dist/hyperdeck-server-connection.cjs.development.js.map
		- dist/hyperdeck-server-connection.cjs.production.min.js
		- dist/hyperdeck-server-connection.cjs.production.min.js.map
		- dist/hyperdeck-server-connection.esm.js
		- dist/hyperdeck-server-connection.esm.js.map
		- dist/index.d.ts
		- dist/index.d.ts.map
		- dist/index.js
		- dist/parser.d.ts
		- dist/parser.d.ts.map
		- dist/server.d.ts
		- dist/server.d.ts.map
		- dist/socket.d.ts
		- dist/socket.d.ts.map
		- dist/types.d.ts
		- dist/types.d.ts.map
		- dist/types/DeserializedCommands.d.ts
		- dist/types/DeserializedCommands.d.ts.map
		- dist/types/ResponseInterface.d.ts
		- dist/types/ResponseInterface.d.ts.map
		- src/__tests__/meta.spec.ts
		- src/index.ts
		- src/parser.ts
		- src/server.ts
		- src/socket.ts
		- src/types.ts
		- src/types/DeserializedCommands.ts
		- src/types/ResponseInterface.ts
		"
	`)
	})
})
