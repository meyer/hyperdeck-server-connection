import * as ResponseInterface from './types/ResponseInterface';

export const formatClipsGetResponse = (
  res: ResponseInterface.ClipsGet
): Record<string, string | number> => {
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
