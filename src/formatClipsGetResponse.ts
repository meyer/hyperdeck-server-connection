import { CommandResponsesByCommandName } from './api';

export const formatClipsGetResponse = (
  res: CommandResponsesByCommandName['clips get']
): Record<string, string | number> => {
  if (!res.clips) {
    return {
      clipsCount: 0,
    };
  }

  const clipsCount = res.clips.length;

  const response: Record<string, string | number> = {
    clipsCount,
  };

  for (let idx = 0; idx < clipsCount; idx++) {
    const clip = res.clips[idx];
    const clipKey = (idx + 1).toString();
    response[clipKey] = `${clip.name} ${clip.startT} ${clip.duration}`;
  }

  return response;
};
