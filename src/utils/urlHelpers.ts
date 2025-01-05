export const serializeValues = (values: Record<string, any>): string => {
  return encodeURIComponent(JSON.stringify(values));
};

export const deserializeValues = (str: string): Record<string, any> => {
  try {
    return JSON.parse(decodeURIComponent(str));
  } catch (e) {
    console.error('Failed to deserialize values:', e);
    return {};
  }
};

export const serializeStructDef = (structDef: string): string => {
  return encodeURIComponent(structDef);
};

export const deserializeStructDef = (str: string): string => {
  try {
    return decodeURIComponent(str);
  } catch (e) {
    console.error('Failed to deserialize struct definition:', e);
    return '';
  }
};
