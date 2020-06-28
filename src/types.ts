export interface NotificationConfig {
  transport: boolean;
  remote: boolean;
  slot: boolean;
  configuration: boolean;
}

export interface DeserializedCommand {
  raw: string;
  name: string;
  parameters: Record<string, string | undefined>;
}

export type ResponseCode = ErrorCode | SynchronousCode | AsynchronousCode;

export enum ErrorCode {
  SyntaxError = 100,
  UnsupportedParameter = 101,
  InvalidValue = 102,
  Unsupported = 103,
  DiskFull = 104,
  NoDisk = 105,
  DiskError = 106,
  TimelineEmpty = 107,
  InternalError = 108,
  OutOfRange = 109,
  NoInput = 110,
  RemoteControlDisabled = 111,
  ConnectionRejected = 120,
  InvalidState = 150,
  InvalidCodec = 151,
  InvalidFormat = 160,
  InvalidToken = 161,
  FormatNotPrepared = 162,
}

export enum SynchronousCode {
  OK = 200,
  SlotInfo = 202,
  DeviceInfo = 204,
  ClipsInfo = 205,
  DiskList = 206,
  TransportInfo = 208,
  Notify = 209,
  Remote = 210,
  Configuration = 211,
  ClipsCount = 214,
  Uptime = 215,
  FormatReady = 216,
}

export enum AsynchronousCode {
  ConnectionInfo = 500,
  SlotInfo = 502,
  TransportInfo = 508,
  RemoteInfo = 510,
  ConfigurationInfo = 511,
}

export type NotifyType = 'slot' | 'transport' | 'remote' | 'configuration';

export const responseNamesByCode: Record<ResponseCode, string> = {
  [AsynchronousCode.ConfigurationInfo]: 'configuration info',
  [AsynchronousCode.ConnectionInfo]: 'connection info',
  [AsynchronousCode.RemoteInfo]: 'remote info',
  [AsynchronousCode.SlotInfo]: 'slot info',
  [AsynchronousCode.TransportInfo]: 'transport info',
  [ErrorCode.ConnectionRejected]: 'connection rejected',
  [ErrorCode.DiskError]: 'disk error',
  [ErrorCode.DiskFull]: 'disk full',
  [ErrorCode.FormatNotPrepared]: 'format not prepared',
  [ErrorCode.InternalError]: 'internal error',
  [ErrorCode.InvalidCodec]: 'invalid codec',
  [ErrorCode.InvalidFormat]: 'invalid format',
  [ErrorCode.InvalidState]: 'invalid state',
  [ErrorCode.InvalidToken]: 'invalid token',
  [ErrorCode.InvalidValue]: 'invalid value',
  [ErrorCode.NoDisk]: 'no disk',
  [ErrorCode.NoInput]: 'no input',
  [ErrorCode.OutOfRange]: 'out of range',
  [ErrorCode.RemoteControlDisabled]: 'remote control disabled',
  [ErrorCode.SyntaxError]: 'syntax error',
  [ErrorCode.TimelineEmpty]: 'timeline empty',
  [ErrorCode.Unsupported]: 'unsupported',
  [ErrorCode.UnsupportedParameter]: 'unsupported parameter',
  [SynchronousCode.ClipsCount]: 'clips count',
  [SynchronousCode.ClipsInfo]: 'clips info',
  [SynchronousCode.Configuration]: 'configuration',
  [SynchronousCode.DeviceInfo]: 'device info',
  [SynchronousCode.DiskList]: 'disk list',
  [SynchronousCode.FormatReady]: 'format ready',
  [SynchronousCode.Notify]: 'notify',
  [SynchronousCode.OK]: 'ok',
  [SynchronousCode.Remote]: 'remote',
  [SynchronousCode.SlotInfo]: 'slot info',
  [SynchronousCode.TransportInfo]: 'transport info',
  [SynchronousCode.Uptime]: 'uptime',
};

export const slotStatus = {
  empty: true,
  mounting: true,
  error: true,
  mounted: true,
};

export type SlotStatus = keyof typeof slotStatus;

export const isSlotStatus = (value: any): value is SlotStatus => {
  return typeof value === 'string' && slotStatus.hasOwnProperty(value);
};

export const videoFormats = {
  NTSC: true,
  PAL: true,
  NTSCp: true,
  PALp: true,
  '720p50': true,
  '720p5994': true,
  '720p60': true,
  '1080p23976': true,
  '1080p24': true,
  '1080p25': true,
  '1080p2997': true,
  '1080p30': true,
  '1080i50': true,
  '1080i5994': true,
  '1080i60': true,
  '4Kp23976': true,
  '4Kp24': true,
  '4Kp25': true,
  '4Kp2997': true,
  '4Kp30': true,
  '4Kp50': true,
  '4Kp5994': true,
  '4Kp60': true,
};

export type VideoFormat = keyof typeof videoFormats;

export const isVideoFormat = (value: any): value is VideoFormat => {
  return typeof value === 'string' && videoFormats.hasOwnProperty(value);
};

export const transportStatus = {
  preview: true,
  stopped: true,
  play: true,
  forward: true,
  rewind: true,
  jog: true,
  shuttle: true,
  record: true,
};

export type TransportStatus = keyof typeof transportStatus;

export const isTransportStatus = (value: any): value is TransportStatus => {
  return typeof value === 'string' && transportStatus.hasOwnProperty(value);
};

export enum FileFormat {
  QuickTimeUncompressed = 'QuickTimeUncompressed',
  QuickTimeProResHQ = 'QuickTimeProResHQ',
  QuickTimeProRes = 'QuickTimeProRes',
  QuickTimeProResLT = 'QuickTimeProResLT',
  QuickTimeProResProxy = 'QuickTimeProResProxy',
  QuickTimeDNxHR220 = 'QuickTimeDNxHR220',
  DNxHR220 = 'DNxHR220',
}

export enum AudioInput {
  embedded = 'embedded',
  XLR = 'XLR',
  RCA = 'RCA',
}

export enum VideoInputs {
  SDI = 'SDI',
  HDMI = 'HDMI',
  component = 'component',
}
