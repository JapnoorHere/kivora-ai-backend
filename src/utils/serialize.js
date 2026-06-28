export const serialize = (doc) => {
  if (!doc) return doc;
  const { _id, __v, createdBy, ...rest } = doc;
  return { id: _id?.toString(), ...rest };
};

export const serializeMany = (docs) => docs.map(serialize);
