// file che calcola cicli in base al tempo totale e a studio/pausa di default (30+5)
export const calcolaCicliStandard = (
  totaleMinuti,
  studioBase = 30,
  pausaBase = 5
) => {
  const tempoCiclo = studioBase + pausaBase;
  
  // se un utente inserisce un tempo inferiore all'unità minima di pomodoro ossia 35 minuti (30 di studio e 5 di pausa)

  const cicli = Math.floor(totaleMinuti / tempoCiclo);

  // per compatibilità manteniamo la stessa struttura di ritorno
  return {
    cicli,
    studio: studioBase,
    pausa: pausaBase,
    totaleInput: totaleMinuti,
  };
};
