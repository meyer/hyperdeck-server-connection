import util from 'util'

export function invariant(condition: any, message: string, ...args: any[]): asserts condition {
	if (!condition) {
		throw new Error(util.format(message, ...args))
	}
}
