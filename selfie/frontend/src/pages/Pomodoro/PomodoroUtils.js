export const calcolaCicliStandard = (totaleMinuti) => {
  const tempoCiclo = 35;
  const studioBase = 30;
  const pausaBase = 5;

  if (totaleMinuti < tempoCiclo) {
    return { error: "Non ha senso lavorare meno di 35 minuti :(" };
  }

  const cicli = Math.floor(totaleMinuti / tempoCiclo);
  const resto = totaleMinuti % tempoCiclo;

  return {
    cicli,
    studio: studioBase,
    pausa: pausaBase,
    pausaFinale: pausaBase + resto,
    resto,
  };
};
