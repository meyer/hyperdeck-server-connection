import { DeserializedCommand, stringToValueFns } from './types';
import { CRLF } from './constants';
import type { Logger } from 'pino';
import { invariant, FormattedError } from './invariant';
import { paramsByCommandName, assertValidCommandName } from './api';

export class MultilineParser {
  private linesQueue: string[] = [];
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger.child({ name: 'MultilineParser' });
  }

  public receivedString(data: string): DeserializedCommand[] {
    const res: DeserializedCommand[] = [];

    // add new lines to processing queue
    const newLines = data.split(CRLF);

    // remove the blank line at the end from the intentionally trailing \r\n
    if (newLines.length > 0 && newLines[newLines.length - 1] === '') newLines.pop();

    this.linesQueue = this.linesQueue.concat(newLines);

    while (this.linesQueue.length > 0) {
      // skip any blank lines
      if (this.linesQueue[0] === '') {
        this.linesQueue.shift();
        continue;
      }

      // if the first line has no colon, then it is a single line command
      if (
        !this.linesQueue[0].includes(':') ||
        (this.linesQueue.length === 1 && this.linesQueue[0].includes(':'))
      ) {
        const parsedResponse = this.parseResponse(this.linesQueue.splice(0, 1));
        if (parsedResponse) {
          res.push(parsedResponse);
        }
        continue;
      }

      const endLine = this.linesQueue.indexOf('');
      if (endLine === -1) {
        // Not got full response yet
        break;
      }

      const lines = this.linesQueue.splice(0, endLine + 1);
      const parsedResponse = this.parseResponse(lines);
      if (parsedResponse) {
        res.push(parsedResponse);
      }
    }

    return res;
  }

  private parseResponse(responseLines: string[]): DeserializedCommand | null {
    try {
      const lines = responseLines.map((l) => l.trim());
      const firstLine = lines[0];

      if (lines.length === 1) {
        if (!firstLine.includes(':')) {
          assertValidCommandName(firstLine);
          return {
            raw: lines.join(CRLF),
            name: firstLine,
            parameters: {},
          } as DeserializedCommand;
        }

        // single-line command with params

        const bits = firstLine.split(': ');

        const commandName = bits.shift();
        assertValidCommandName(commandName);

        const params: Record<string, any> = {};
        const paramNames = paramsByCommandName[commandName];
        let param = bits.shift();
        invariant(param, 'No named parameters found');

        for (let i = 0; i < bits.length - 1; i++) {
          const bit = bits[i];
          const bobs = bit.split(' ');

          let nextParam = '';
          for (let i = bobs.length - 1; i >= 0; i--) {
            nextParam = (bobs.pop() + ' ' + nextParam).trim();
            if (paramNames.hasOwnProperty(nextParam)) {
              break;
            }
          }

          invariant(bobs.length > 0, 'Command malformed / paramName not recognised: `%s`', bit);
          invariant(paramNames.hasOwnProperty(param), 'Unsupported param: `%o`', param);

          const value = bobs.join(' ');
          const { paramName, paramType } = paramNames[param];

          const formatter = stringToValueFns[paramType];
          params[paramName] = formatter(value);
          param = nextParam;
        }

        invariant(paramNames.hasOwnProperty(param), 'Unsupported param: `%o`', param);

        const value = bits[bits.length - 1];
        const { paramName, paramType } = paramNames[param];

        const formatter = stringToValueFns[paramType];
        params[paramName] = formatter(value);

        return {
          raw: lines.join(CRLF),
          name: commandName,
          parameters: params,
        } as DeserializedCommand;
      }

      invariant(
        firstLine.endsWith(':'),
        'Expected a line ending in semicolon, received `%o`',
        firstLine
      );

      // remove the semicolon at the end of the command
      const commandName = firstLine.slice(0, -1);

      assertValidCommandName(commandName);

      const paramNames = paramsByCommandName[commandName];

      const params: Record<string, any> = {};

      for (const line of lines) {
        const lineMatch = line.match(/^(.*?): (.*)$/im);
        invariant(lineMatch, 'Failed to parse line: `%o`', line);

        const param = lineMatch[1];
        const value = lineMatch[2];
        invariant(paramNames.hasOwnProperty(param), 'Unsupported param: `%o`', param);
        const { paramName, paramType } = paramNames[param];

        const formatter = stringToValueFns[paramType];
        params[paramName] = formatter(value);
      }

      const res: DeserializedCommand = {
        raw: lines.join(CRLF),
        name: commandName,
        parameters: params,
      } as DeserializedCommand;

      return res;
    } catch (err) {
      if (err instanceof FormattedError) {
        this.logger.error(err.template, ...err.args);
      } else {
        this.logger.error({ err: err + '' }, 'parseResponse error');
      }

      return null;
    }
  }
}
