import { invariant } from './invariant';
import { camelcaseToSpaceCase } from './utils';
import { ArgKey, ArgsTypes } from './types';

interface Option<
  A extends Record<string, ArgKey> = Record<string, ArgKey>,
  R extends Record<string, ArgKey> = Record<string, ArgKey>
> {
  description: string;
  arguments?: A;
  returnValue: R;
}

type ParamMap = Record<string, Option>;

interface ParamInfo {
  paramType: ArgKey;
  /** The camelcase name we use everywhere */
  paramName: string;
}

/** Internal container class that holds metadata about each HyperDeck event */
class HyperDeckAPI<P extends ParamMap = {}> {
  constructor(
    // public only because TS apparently strips types from private methods
    public readonly options: P = {} as any
  ) {}

  public addOption = <
    K extends string,
    A extends Record<string, ArgKey> = {},
    R extends Record<string, ArgKey> = {}
  >(
    key: K | [K, ...string[]],
    option: Option<A, R>
  ): HyperDeckAPI<P & { [key in K]: Option<A, R> }> => {
    const k = Array.isArray(key) ? key[0] : key;
    invariant(!this.options.hasOwnProperty(k), 'option already exists for key `%s`', k);
    // NOTE: this mutates the original options object
    // shouldn't be a problem since this is only used internally
    Object.assign(this.options, { [k]: option });
    return this as any;
  };

  /** Get a `Set` of param names keyed by function name */
  public getParamsByCommandName = (): { [K in keyof P]: Record<string, ParamInfo> } =>
    Object.entries(this.options).reduce<Record<string, Record<string, ParamInfo>>>(
      (prev, [commandName, value]) => {
        if (!value.arguments) {
          // we still want hasOwnProperty(key) to be true
          prev[commandName] = {};
          return prev;
        }
        prev[commandName] = Object.entries(value.arguments).reduce<Record<string, ParamInfo>>(
          (argObj, [argKey, argType]) => {
            argObj[camelcaseToSpaceCase(argKey)] = {
              paramType: argType,
              paramName: argKey,
            };
            return argObj;
          },
          {}
        );
        return prev;
      },
      {}
    ) as any;
}

const api = new HyperDeckAPI()
  .addOption(['help', '?'], {
    description: 'Provides help text on all commands and parameters',
    returnValue: {},
  })
  .addOption('commands', {
    description: 'return commands in XML format',
    returnValue: {
      commands: 'string',
    },
  })
  .addOption('device info', {
    description: 'return device information',
    returnValue: {
      protocolVersion: 'string',
      model: 'string',
      slotCount: 'string',
    },
  })
  .addOption('disk list', {
    description: 'query clip list on active disk',
    arguments: {
      slotId: 'number',
    },
    returnValue: {
      slotId: 'number',
      // TODO(meyer) array of clips
    },
  })
  .addOption('quit', {
    description: 'disconnect ethernet control',
    returnValue: {},
  })
  .addOption('ping', {
    description: 'check device is responding',
    returnValue: {},
  })
  .addOption('preview', {
    description: 'switch to preview or output',
    arguments: {
      enable: 'boolean',
    },
    returnValue: {},
  })
  .addOption('play', {
    description: 'play from current timecode',
    arguments: {
      speed: 'number',
      loop: 'boolean',
      singleClip: 'boolean',
    },
    returnValue: {},
  })
  .addOption('playrange', {
    description: 'query playrange setting',
    returnValue: {
      // TODO(meyer) this isn't accurate
    },
  })
  .addOption('playrange set', {
    description: 'set play range to play clip {n} only',
    arguments: {
      // maybe number?
      clipId: 'number',
      // description: 'set play range to play between timecode {inT} and timecode {outT}',
      in: 'timecode',
      out: 'timecode',
      // 'set play range in units of frames between timeline position {in} and position {out} clear/reset play range°setting',
      timelineIn: 'number',
      timelineOut: 'number',
    },
    returnValue: {},
  })
  .addOption('playrange clear', {
    description: 'clear/reset play range setting',
    returnValue: {},
  })
  .addOption('play on startup', {
    description: 'query unit play on startup state',
    // description: 'enable or disable play on startup',
    arguments: {
      enable: 'boolean',
      singleClip: 'boolean',
    },
    // TODO(meyer) verify that there's no return value
    returnValue: {},
  })
  .addOption('play option', {
    description: 'query play options',
    arguments: {
      stopMode: 'stopmode',
    },
    // TODO(meyer)
    returnValue: {},
  })
  .addOption('record', {
    description: 'record from current input',
    arguments: {
      name: 'string',
    },
    returnValue: {},
  })
  .addOption('record spill', {
    description: 'spill current recording to next slot',
    arguments: {
      slotId: 'number',
    },
    // TODO(meyer)
    returnValue: {},
  })
  .addOption('stop', {
    description: 'stop playback or recording',
    returnValue: {},
  })
  .addOption('clips count', {
    description: 'query number of clips on timeline',
    returnValue: {
      clipCount: 'number',
    },
  })
  .addOption('clips get', {
    description: 'query all timeline clips',
    arguments: {
      clipId: 'number',
      count: 'number',
      version: 'number',
    },
    returnValue: {
      clips: 'clips',
    },
  })
  .addOption('clips add', {
    description: 'append a clip to timeline',
    arguments: {
      name: 'string',
      clipId: 'number',
      in: 'timecode',
      out: 'timecode',
    },
    returnValue: {},
  })
  .addOption('clips remove', {
    description: 'remove clip {n} from the timeline (invalidates clip ids following clip {n})',
    arguments: {
      clipId: 'number',
    },
    // TODO(meyer) verify this
    returnValue: {},
  })
  .addOption('clips clear', {
    description: 'empty timeline clip list',
    returnValue: {},
  })
  .addOption('transport info', {
    description: 'query current activity',
    returnValue: {
      status: 'transportstatus',
      speed: 'number',
      slotId: 'number',
      clipId: 'number',
      singleClip: 'boolean',
      displayTimecode: 'timecode',
      timecode: 'timecode',
      videoFormat: 'videoformat',
      loop: 'boolean',
    },
  })
  .addOption('slot info', {
    description: 'query active slot',
    arguments: {
      slotId: 'number',
    },
    returnValue: {
      slotId: 'number',
      status: 'slotstatus',
      volumeName: 'string',
      recordingTime: 'timecode',
      videoFormat: 'videoformat',
    },
  })
  .addOption('slot select', {
    description: 'switch to specified slot',
    arguments: {
      slotId: 'number',
      videoFormat: 'videoformat',
    },
    returnValue: {},
  })
  .addOption('slot unblock', {
    description: 'unblock active slot',
    arguments: {
      slotId: 'number',
    },
    // TODO(meyer) verify this
    returnValue: {},
  })
  .addOption('dynamic range', {
    description: 'query dynamic range settings',
    arguments: {
      // TODO(meyer) is this correct?
      playbackOverride: 'string',
    },
    // TODO(meyer)
    returnValue: {},
  })
  .addOption('notify', {
    description: 'query notification status',
    arguments: {
      remote: 'boolean',
      transport: 'boolean',
      slot: 'boolean',
      configuration: 'boolean',
      droppedFrames: 'boolean',
      displayTimecode: 'boolean',
      timelinePosition: 'boolean',
      playrange: 'boolean',
      dynamicRange: 'boolean',
    },
    returnValue: {
      remote: 'boolean',
      transport: 'boolean',
      slot: 'boolean',
      configuration: 'boolean',
      droppedFrames: 'boolean',
      displayTimecode: 'boolean',
      timelinePosition: 'boolean',
      playrange: 'boolean',
      dynamicRange: 'boolean',
    },
  })
  .addOption('goto', {
    description: 'go forward or backward within a clip or timeline',
    arguments: {
      clipId: 'number',
      clip: 'goto',
      timeline: 'goto',
      timecode: 'timecode',
      slotId: 'number',
    },
    returnValue: {},
  })
  .addOption('jog', {
    description: 'jog forward or backward',
    arguments: {
      timecode: 'timecode',
    },
    returnValue: {},
  })
  .addOption('shuttle', {
    description: 'shuttle with speed',
    arguments: {
      speed: 'number',
    },
    returnValue: {},
  })
  .addOption('remote', {
    description: 'query unit remote control state',
    arguments: {
      enable: 'boolean',
      override: 'boolean',
    },
    // TODO(meyer)
    returnValue: {},
  })
  .addOption('configuration', {
    description: 'query configuration settings',
    arguments: {
      videoInput: 'videoinput',
      audioInput: 'audioinput',
      fileFormat: 'fileformat',
      audioCodec: 'audiocodec',
      timecodeInput: 'timecodeinput',
      timecodePreset: 'timecode',
      audioInputChannels: 'number',
      recordTrigger: 'recordtrigger',
      recordPrefix: 'string',
      appendTimestamp: 'boolean',
    },
    returnValue: {
      videoInput: 'videoinput',
      audioInput: 'audioinput',
      fileFormat: 'fileformat',
      audioCodec: 'audiocodec',
      timecodeInput: 'timecodeinput',
      timecodePreset: 'timecode',
      audioInputChannels: 'number',
      recordTrigger: 'recordtrigger',
      recordPrefix: 'string',
      appendTimestamp: 'boolean',
    },
  })
  .addOption('uptime', {
    description: 'return time since last boot',
    returnValue: {
      uptime: 'number',
    },
  })
  .addOption('format', {
    description: 'prepare a disk formatting operation to filesystem {format}',
    arguments: {
      prepare: 'string',
      confirm: 'string',
    },
    returnValue: {
      token: 'string',
    },
  })
  .addOption('identify', {
    description: 'identify the device',
    arguments: {
      enable: 'boolean',
    },
    // TODO(meyer) verify
    returnValue: {},
  })
  .addOption('watchdog', {
    description: 'client connection timeout',
    arguments: {
      period: 'number',
    },
    // TODO(meyer) verify
    returnValue: {},
  });

type CommandConfigs = { [K in keyof typeof api['options']]: typeof api['options'][K] };

export const paramsByCommandName = api.getParamsByCommandName();

export type CommandName = keyof CommandConfigs;

export type CommandParamsByCommandName = {
  [K in CommandName]: ArgsTypes<NonNullable<CommandConfigs[K]['arguments']>>;
};

export type CommandResponsesByCommandName = {
  [K in CommandName]: ArgsTypes<NonNullable<CommandConfigs[K]['returnValue']>>;
};

export function assertValidCommandName(value: any): asserts value is CommandName {
  invariant(
    typeof value === 'string' && paramsByCommandName.hasOwnProperty(value),
    'Invalid command: `%o`',
    value
  );
}
