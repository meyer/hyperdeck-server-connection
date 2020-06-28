import type { Timecode } from '../Timecode';
import type {
  TransportStatus,
  VideoFormat,
  SlotStatus,
  AudioInput,
  VideoInput,
  FileFormat,
} from '../types';

export interface DeviceInfo {
  'protocol version': string;
  model: string;
  'slot count': string;
}

export interface DiskList extends Record<string, string> {
  'slot id': string;
}

export interface ClipsCount {
  'clip count': string;
}

export interface ClipV1 {
  name: string;
  startT: Timecode;
  duration: Timecode;
}

export interface ClipV2 {
  startT: Timecode;
  duration: number;
  inT: Timecode;
  outT: Timecode;
  name: string;
}

export interface ClipsGet {
  clips: ClipV1[];
}

export interface TransportInfo {
  status: TransportStatus;
  speed: string;
  'slot id': string;
  'clip id': string;
  'single clip': string;
  'display timecode': string;
  timecode: string;
  'video format': VideoFormat;
  loop: string;
}

export interface SlotInfo {
  'slot id': string;
  status: SlotStatus;
  'volume name': string;
  'recording time': string;
  'video format': VideoFormat;
}

export interface Configuration {
  'audio input': AudioInput;
  'video input': VideoInput;
  'file format': FileFormat;
}

export interface Uptime {
  uptime: string;
}

export interface Format {
  token: string;
}

export interface RemoteInfoResponse {
  enabled: boolean;
  override: boolean;
}
