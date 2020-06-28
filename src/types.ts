import { invariant } from './invariant';
import { Timecode } from './Timecode';

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

export const stopModes = {
  lastframe: true,
  nextframe: true,
  black: true,
};

export type StopMode = keyof typeof stopModes;

export const isStopMode = (value: any): value is StopMode => {
  return typeof value === 'string' && stopModes.hasOwnProperty(value);
};

export const videoInputs = {
  SDI: true,
  HDMI: true,
  component: true,
};

export type VideoInput = keyof typeof videoInputs;

export const isVideoInput = (value: any): value is VideoInput => {
  return typeof value === 'string' && videoInputs.hasOwnProperty(value);
};

export const audioInputs = {
  XLR: true,
  RCA: true,
  // TODO(meyer) verify this
  embedded: true,
};

export type AudioInput = keyof typeof audioInputs;

export const isAudioInput = (value: any): value is AudioInput => {
  return typeof value === 'string' && audioInputs.hasOwnProperty(value);
};

export const audioCodecs = {
  PCM: true,
  AAC: true,
};

export type AudioCodec = keyof typeof audioCodecs;

export const isAudioCodec = (value: any): value is AudioCodec => {
  return typeof value === 'string' && audioCodecs.hasOwnProperty(value);
};

export const timecodeInputs = {
  external: true,
  embedded: true,
  preset: true,
  clip: true,
};

export type TimecodeInput = keyof typeof timecodeInputs;

export const isTimecodeInput = (value: any): value is TimecodeInput => {
  return typeof value === 'string' && timecodeInputs.hasOwnProperty(value);
};

export const recordTriggers = {
  none: true,
  recordbit: true,
  timecoderun: true,
};

export type RecordTrigger = keyof typeof recordTriggers;

export const isRecordTrigger = (value: any): value is RecordTrigger => {
  return typeof value === 'string' && recordTriggers.hasOwnProperty(value);
};

export type FileFormat =
  | 'QuickTimeUncompressed'
  | 'QuickTimeProResHQ'
  | 'QuickTimeProRes'
  | 'QuickTimeProResLT'
  | 'QuickTimeProResProxy'
  | 'QuickTimeDNxHR220'
  | 'DNxHR220';

export type ArgKey = keyof TypesByStringKey;

export interface TypesByStringKey {
  boolean: boolean;
  string: string;
  timecode: Timecode;
  number: number;
  videoformat: VideoFormat;
  stopmode: StopMode;
  goto: 'start' | 'end' | string | number;
  videoinput: VideoInput;
  audioinput: AudioInput;
  fileformat: string;
  audiocodec: AudioCodec;
  timecodeinput: TimecodeInput;
  recordtrigger: RecordTrigger;
}

export const stringToValueFns: {
  /** Coerce string to the correct type or throw if the string cannot be converted. */
  [K in keyof TypesByStringKey]: (value: string) => TypesByStringKey[K];
} = {
  boolean: (value) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    invariant(false, 'Unsupported value `%o` passed to `boolean`', value);
  },
  string: (value) => value,
  timecode: (value) => Timecode.toTimecode(value),
  number: (value) => {
    const valueNum = parseFloat(value);
    invariant(!isNaN(valueNum), 'valueNum `%o` is NaN', value);
    return valueNum;
  },
  videoformat: (value) => {
    invariant(isVideoFormat(value), 'Unsupported video format: `%o`');
    return value;
  },
  stopmode: (value) => {
    invariant(isStopMode(value), 'Unsupported stopmode: `%o`', value);
    return value;
  },
  goto: (value) => {
    if (value === 'start' || value === 'end') {
      return value;
    }
    const valueNum = parseInt(value, 10);
    if (!isNaN(valueNum)) {
      return valueNum;
    }
    // TODO(meyer) validate further
    return value;
  },
  videoinput: (value) => {
    invariant(isVideoInput(value), 'Unsupported video input: `%o`', value);
    return value;
  },
  audioinput: (value) => {
    invariant(isAudioInput(value), 'Unsupported audio input: `%o`', value);
    return value;
  },
  fileformat: (value) => value,
  audiocodec: (value) => {
    invariant(isAudioCodec(value), 'Unsupported audio codec: `%o`', value);
    return value;
  },
  timecodeinput: (value) => {
    invariant(isTimecodeInput(value), 'Unsupported timecode input: `%o`', value);
    return value;
  },
  recordtrigger: (value) => {
    invariant(isRecordTrigger(value), 'Unsupported record trigger: `%o`', value);
    return value;
  },
};
