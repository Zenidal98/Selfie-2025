// offset di base che all'inizio è 0 ossia al tempo normale del sistema operativo
let offsetMs = 0;

export const setOffset = (ms) => {
  offsetMs = ms;
};

export const resetOffset = () => {
  offsetMs = 0;
};

export const getOffset = () => offsetMs;

export const getNow = () => {
  return new Date(Date.now() + offsetMs);
};

export const applyOffset = (date) => new Date(date.getTime() + offsetMs);
