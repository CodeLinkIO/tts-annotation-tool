export const secondsToTime = (
  seconds: number,
  noMilliseconds?: boolean,
): string => {
  if (isNaN(seconds)) return '';
  return new Date(seconds * 1000)
    .toISOString()
    .substring(14, !noMilliseconds ? 22 : 19);
};

export const getYouTubeVideoId = (url: string) => {
  const regExp =
    /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[7].length === 11 ? match[7] : false;
};
