import pino from 'pino'

export const getTestLogger = () => {
	const loggedOutput: any[] = []

	const logger = pino({
		level: 'trace',
		name: 'pino-jest',
		prettyPrint: true,
		prettifier: () => ({
			// all the stuff we want to omit
			pid,
			source,
			time,
			hostname,
			name,
			// the remainder
			...args
		}: Record<string, any>) => {
			loggedOutput.push(args)
		}
	})

	const getLoggedOutput = () => loggedOutput

	return {
		logger,
		getLoggedOutput
	}
}
