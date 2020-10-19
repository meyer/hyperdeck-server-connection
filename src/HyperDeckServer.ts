import { HyperDeckSocket } from './HyperDeckSocket';
import type { ReceivedCommandCallback } from './HyperDeckSocket';
import { SynchronousCode, ErrorCode, NotifyType, CommandHandler, CommandResponse } from './types';
import { createServer, Server } from 'net';
import pino from 'pino';
import { CommandName, paramsByCommandName } from './api';
import { formatClipsGetResponse } from './formatClipsGetResponse';
import { invariant } from './invariant';

const internalCommands = {
  remote: true,
  notify: true,
  watchdog: true,
  ping: true,
};

interface FDListenOptions {
  fd: number;
}

interface IPListenOptions {
  ip: string;
  /** Defaults to 9993 */
  port?: number;
}

type SupportedCommands = Exclude<CommandName, keyof typeof internalCommands>;

export class HyperDeckServer {
  private logger: pino.Logger;
  private sockets: { [id: string]: HyperDeckSocket } = {};
  private server: Server;

  constructor(listenOpts: FDListenOptions | IPListenOptions, logger = pino()) {
    this.logger = logger.child({ name: 'HyperDeck Emulator' });

    this.server = createServer((socket) => {
      this.logger.info('connection');

      const socketId = Math.random().toString(35).substr(-6);

      const socketLogger = this.logger.child({ name: 'HyperDeck socket ' + socketId });

      this.sockets[socketId] = new HyperDeckSocket(socket, socketLogger, this.receivedCommand);

      this.sockets[socketId].on('disconnected', () => {
        socketLogger.info('disconnected');
        delete this.sockets[socketId];
      });
    });

    this.server.on('listening', () => {
      this.logger.info('listening', { address: this.server.address() });
    });
    this.server.on('close', () => this.logger.info('connection closed'));
    this.server.on('error', (err) => this.logger.error('server error:', err));
    this.server.maxConnections = 1;
    if ('ip' in listenOpts) {
      this.server.listen(listenOpts.port || 9993, listenOpts.ip);
    } else if ('fd' in listenOpts) {
      this.server.listen({ fd: listenOpts.fd });
    } else {
      invariant(false, 'Invalid listen options: `%o`', listenOpts);
    }
  }

  close(): void {
    this.server.unref();
  }

  notifySlot(params: Record<string, string>): void {
    this.notify('slot', params);
  }

  notifyTransport(params: Record<string, string>): void {
    this.notify('transport', params);
  }

  private notify(type: NotifyType, params: Record<string, string>): void {
    for (const id of Object.keys(this.sockets)) {
      this.sockets[id].notify(type, params);
    }
  }

  private commandHandlers: { [K in CommandName]?: CommandHandler<K> } = {};

  public on = <T extends SupportedCommands>(key: T, handler: CommandHandler<T>): void => {
    invariant(paramsByCommandName.hasOwnProperty(key), 'Invalid key: `%s`', key);

    invariant(
      !this.commandHandlers.hasOwnProperty(key),
      'Handler already registered for `%s`',
      key
    );

    this.commandHandlers[key] = handler as any;
  };

  private receivedCommand: ReceivedCommandCallback = async (cmd) => {
    // TODO(meyer) more sophisticated debouncing
    await new Promise((resolve) => setTimeout(() => resolve(), 200));

    this.logger.info({ cmd }, 'receivedCommand %s', cmd.name);

    if (cmd.name === 'remote') {
      return {
        code: SynchronousCode.Remote,
        params: {
          enabled: true,
          override: false,
        },
      };
    }

    // implemented in socket.ts
    if (cmd.name === 'notify' || cmd.name === 'watchdog' || cmd.name === 'ping') {
      return SynchronousCode.OK;
    }

    const handler = this.commandHandlers[cmd.name];
    if (!handler) {
      this.logger.error({ cmd }, 'unimplemented');
      return ErrorCode.Unsupported;
    }

    const response = await handler(cmd);

    const result: CommandResponse = {
      name: cmd.name,
      response,
    } as any;

    if (
      result.name === 'clips add' ||
      result.name === 'clips clear' ||
      result.name === 'goto' ||
      result.name === 'identify' ||
      result.name === 'jog' ||
      result.name === 'play' ||
      result.name === 'playrange clear' ||
      result.name === 'playrange set' ||
      result.name === 'preview' ||
      result.name === 'record' ||
      result.name === 'shuttle' ||
      result.name === 'slot select' ||
      result.name === 'stop'
    ) {
      return SynchronousCode.OK;
    }

    if (result.name === 'device info') {
      return { code: SynchronousCode.DeviceInfo, params: result.response };
    }

    if (result.name === 'disk list') {
      return { code: SynchronousCode.DiskList, params: result.response };
    }

    if (result.name === 'clips count') {
      return { code: SynchronousCode.ClipsCount, params: result.response };
    }

    if (result.name === 'clips get') {
      return { code: SynchronousCode.ClipsInfo, params: formatClipsGetResponse(result.response) };
    }

    if (result.name === 'transport info') {
      return { code: SynchronousCode.TransportInfo, params: result.response };
    }

    if (result.name === 'slot info') {
      return { code: SynchronousCode.SlotInfo, params: result.response };
    }

    if (result.name === 'configuration') {
      if (result) {
        return { code: SynchronousCode.Configuration, params: result.response };
      }
      return SynchronousCode.OK;
    }

    if (result.name === 'uptime') {
      return { code: SynchronousCode.Uptime, params: result.response };
    }

    if (result.name === 'format') {
      if (result) {
        return { code: SynchronousCode.FormatReady, params: result.response };
      }
      return SynchronousCode.OK;
    }

    this.logger.error({ cmd, res: result }, 'Unsupported command');
    return ErrorCode.Unsupported;
  };
}
