// utils/parseBoolean.ts  (or top of your category service file)
export const parseBoolean = (v: any): boolean | undefined => {
  if (v === true || v === false) return v;

  if (typeof v === 'number') return v === 1;

  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    if (s === 'true' || s === '1' || s === 'yes') return true;
    if (s === 'false' || s === '0' || s === 'no' || s === '') return false;
    // if string is not recognizable, return undefined so we don't apply a wrong filter
    return undefined;
  }

  return undefined;
};
