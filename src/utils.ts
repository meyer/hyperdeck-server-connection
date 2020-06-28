/** Convert `yourExampleKey` to `your example key` */
export const camelcaseToSpaceCase = (key: string): string => {
  return key.replace(/([a-z])([A-Z]+)/g, '$1 $2').toLowerCase();
};
