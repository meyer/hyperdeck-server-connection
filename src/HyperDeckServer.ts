import { HyperDeckSocket } from './HyperDeckSocket';
import type { ReceivedCommandCallback } from './HyperDeckSocket';
import { DeserializedCommand, SynchronousCode, ErrorCode, NotifyType } from './types';
import * as ResponseInterface from './types/ResponseInterface';
import * as DeserializedCommands from './types/DeserializedCommands';
import { formatClipsGetResponse } from './formatClipsGetResponse';
import { createServer, Server } from 'net';
import pino from 'pino';
import { invariant } from './invariant';

type Handler<C extends DeserializedCommand, R extends any> = (command: C) => Promise<R>;

class UnimplementedError extends Error {}

const noop = async () => {
  throw new UnimplementedError();
};

export class HyperDeckServer {
  private logger: pino.Logger;
  private sockets: { [id: string]: HyperDeckSocket } = {};
  private server: Server;

  onDeviceInfo: Handler<DeserializedCommand, ResponseInterface.DeviceInfo> = noop;
  onDiskList: Handler<DeserializedCommand, ResponseInterface.DiskList> = noop;
  onPreview: Handler<DeserializedCommands.PreviewCommand, void> = noop;
  onPlay: Handler<DeserializedCommands.PlayCommand, void> = noop;
  onPlayrangeSet: Handler<DeserializedCommands.PlayrangeSetCommand, void> = noop;
  onPlayrangeClear: Handler<DeserializedCommand, void> = noop;
  onRecord: Handler<DeserializedCommands.RecordCommand, void> = noop;
  onStop: Handler<DeserializedCommand, void> = noop;
  onClipsCount: Handler<DeserializedCommand, ResponseInterface.ClipsCount> = noop;
  onClipsGet: Handler<DeserializedCommands.ClipsGetCommand, ResponseInterface.ClipsGet> = noop;
  onClipsAdd: Handler<DeserializedCommands.ClipsAddCommand, void> = noop;
  onClipsClear: Handler<DeserializedCommand, void> = noop;
  onTransportInfo: Handler<DeserializedCommand, ResponseInterface.TransportInfo> = noop;
  onSlotInfo: Handler<DeserializedCommands.SlotInfoCommand, ResponseInterface.SlotInfo> = noop;
  onSlotSelect: Handler<DeserializedCommands.SlotSelectCommand, void> = noop;
  onGoTo: Handler<DeserializedCommands.GoToCommand, void> = noop;
  onJog: Handler<DeserializedCommands.JogCommand, void> = noop;
  onShuttle: Handler<DeserializedCommands.ShuttleCommand, void> = noop;
  onConfiguration: Handler<
    DeserializedCommands.ConfigurationCommand,
    ResponseInterface.Configuration
  > = noop;
  onUptime: Handler<DeserializedCommand, ResponseInterface.Uptime> = noop;
  onFormat: Handler<DeserializedCommands.FormatCommand, ResponseInterface.Format> = noop;
  onIdentify: Handler<DeserializedCommands.IdentifyCommand, void> = noop;
  onWatchdog: Handler<DeserializedCommands.WatchdogCommand, void> = noop;

  constructor(ip?: string, logger = pino()) {
    this.logger = logger.child({ name: 'HyperDeck Emulator' });

    this.server = createServer((socket) => {
      this.logger.info('connection');
      const socketId = Math.random().toString(35).substr(-6);

      const socketLogger = this.logger.child({ name: 'HyperDeck socket ' + socketId });

      this.sockets[socketId] = new HyperDeckSocket(socket, socketLogger, (cmd) =>
        this.receivedCommand(cmd)
      );

      this.sockets[socketId].on('disconnected', () => {
        socketLogger.info('disconnected');
        delete this.sockets[socketId];
      });
    });

    this.server.on('listening', () => this.logger.info('listening'));
    this.server.on('close', () => this.logger.info('connection closed'));
    this.server.on('error', (err) => this.logger.error('server error:', err));
    this.server.maxConnections = 1;
    this.server.listen(9993, ip);
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

  private receivedCommand: ReceivedCommandCallback = async (cmd) => {
    // TODO(meyer) more sophisticated debouncing
    await new Promise((resolve) => setTimeout(() => resolve(), 200));

    this.logger.info({ cmd }, '<-- ' + cmd.name);
    try {
      if (cmd.name === 'device info') {
        const res = await this.onDeviceInfo(cmd);
        return { code: SynchronousCode.DeviceInfo, params: res };
      }

      if (cmd.name === 'disk list') {
        const res = await this.onDiskList(cmd);
        return { code: SynchronousCode.DiskList, params: res };
      }

      if (cmd.name === 'preview') {
        await this.onPreview(cmd);
        return SynchronousCode.OK;
      }

      if (cmd.name === 'play') {
        await this.onPlay(cmd);
        return SynchronousCode.OK;
      }

      if (cmd.name === 'playrange set') {
        await this.onPlayrangeSet(cmd);
        return SynchronousCode.OK;
      }

      if (cmd.name === 'playrange clear') {
        await this.onPlayrangeClear(cmd);
        return SynchronousCode.OK;
      }

      if (cmd.name === 'record') {
        await this.onRecord(cmd);
        return SynchronousCode.OK;
      }

      if (cmd.name === 'stop') {
        await this.onStop(cmd);
        return SynchronousCode.OK;
      }

      if (cmd.name === 'clips count') {
        const res = await this.onClipsCount(cmd);
        return { code: SynchronousCode.ClipsCount, params: res };
      }

      if (cmd.name === 'clips get') {
        const res = await this.onClipsGet(cmd).then(formatClipsGetResponse);
        return { code: SynchronousCode.ClipsInfo, params: res };
      }

      if (cmd.name === 'clips add') {
        await this.onClipsAdd(cmd);
        return SynchronousCode.OK;
      }

      if (cmd.name === 'clips clear') {
        await this.onClipsClear(cmd);
        return SynchronousCode.OK;
      }

      if (cmd.name === 'transport info') {
        const res = await this.onTransportInfo(cmd);
        return { code: SynchronousCode.TransportInfo, params: res };
      }

      if (cmd.name === 'slot info') {
        const res = await this.onSlotInfo(cmd);
        return { code: SynchronousCode.SlotInfo, params: res };
      }

      if (cmd.name === 'slot select') {
        await this.onSlotSelect(cmd);
        return SynchronousCode.OK;
      }

      if (cmd.name === 'notify') {
        // implemented in socket.ts
        return SynchronousCode.OK;
      }

      if (cmd.name === 'go to') {
        await this.onGoTo(cmd);
        return SynchronousCode.OK;
      }

      if (cmd.name === 'jog') {
        await this.onJog(cmd);
        return SynchronousCode.OK;
      }

      if (cmd.name === 'shuttle') {
        await this.onShuttle(cmd);
        return SynchronousCode.OK;
      }

      if (cmd.name === 'remote') {
        return {
          code: SynchronousCode.Remote,
          params: {
            enabled: true,
            override: false,
          },
        };
      }

      if (cmd.name === 'configuration') {
        const res = await this.onConfiguration(cmd);
        if (res) {
          return { code: SynchronousCode.Configuration, params: res };
        }
        return SynchronousCode.OK;
      }

      if (cmd.name === 'uptime') {
        const res = await this.onUptime(cmd);
        return { code: SynchronousCode.Uptime, params: res };
      }

      if (cmd.name === 'format') {
        const res = await this.onFormat(cmd);
        if (res) {
          return { code: SynchronousCode.FormatReady, params: res };
        }
        return SynchronousCode.OK;
      }

      if (cmd.name === 'identify') {
        await this.onIdentify(cmd);
        return SynchronousCode.OK;
      }

      if (cmd.name === 'watchdog') {
        // implemented in socket.ts
        return SynchronousCode.OK;
      }

      if (cmd.name === 'ping') {
        // implemented in socket.ts
        return SynchronousCode.OK;
      }

      invariant(false, 'Unhandled command name: `%s`', cmd.name);
    } catch (err) {
      if (err instanceof UnimplementedError) {
        this.logger.error({ cmd }, 'unimplemented');
        return ErrorCode.Unsupported;
      }

      this.logger.error({ cmd, err: err.message }, 'unhandled command name');
      return ErrorCode.InternalError;
    }
  };
}
