// Simple in-memory offset (ms). Default = 0 (real time).
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
