export const calcolaCicliOttimali = (totaleMinuti) => {
    let best = {
      studio: 30,
      pausa: 5,
      cicli: 5,
    };
  
    for (let pausa = 5; pausa <= 15; pausa += 5) {
      for (let studio = 25; studio <= 50; studio += 5) {
        const durataCiclo = studio + pausa;
        const cicli = Math.floor(totaleMinuti / durataCiclo);
        const tempoUsato = cicli * durataCiclo;
  
        if (tempoUsato === totaleMinuti && cicli > best.cicli) {
          best = { studio, pausa, cicli };
        }
      }
    }
  
    return best;
  };
  