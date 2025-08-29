// Calcola cicli in base al tempo totale e a studio/pausa di default (30+5)
export const calcolaCicliStandard = (
  totaleMinuti,
  studioBase = 30,
  pausaBase = 5
) => {
  const tempoCiclo = studioBase + pausaBase;

  if (totaleMinuti < tempoCiclo) {
    return { error: `Non ha senso lavorare meno di ${tempoCiclo} minuti :(` };
  }

  const cicli = Math.floor(totaleMinuti / tempoCiclo);
  const resto = totaleMinuti % tempoCiclo;

  // per compatibilità manteniamo la stessa struttura di ritorno
  return {
    cicli,
    studio: studioBase,
    pausa: pausaBase,
    pausaFinale: pausaBase + resto, // ultima pausa estesa
    resto,
    totaleUsato: cicli * tempoCiclo + resto,
    totaleInput: totaleMinuti,
  };
};
