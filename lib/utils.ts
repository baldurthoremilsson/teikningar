export const singularOrPlural = (
  i: number,
  singular: string,
  plural: string,
) => (i % 10 === 1 && i % 100 !== 11 ? singular : plural);
