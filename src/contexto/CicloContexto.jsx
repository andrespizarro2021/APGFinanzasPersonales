import React, { createContext, useContext, useState, useEffect } from 'react';

const CicloContexto = createContext();

export const ProveedorCiclo = ({ children }) => {
  // Inicializa el día del ciclo desde localStorage, por defecto el 21
  const [diaInicioCiclo, setDiaInicioCiclo] = useState(() => {
    const guardado = localStorage.getItem('dia_inicio_ciclo');
    return guardado ? Number(guardado) : 21;
  });

  // Cada vez que cambie el día, se guarda en localStorage para que persista
  useEffect(() => {
    localStorage.setItem('dia_inicio_ciclo', diaInicioCiclo);
  }, [diaInicioCiclo]);

  // Función para actualizar el día de inicio (del 1 al 28 para evitar problemas con febrero)
  const actualizarDiaInicio = (nuevoDia) => {
    const diaNum = Number(nuevoDia);
    if (diaNum >= 1 && diaNum <= 28) {
      setDiaInicioCiclo(diaNum);
    }
  };

  return (
    <CicloContexto.Provider value={{ diaInicioCiclo, actualizarDiaInicio }}>
      {children}
    </CicloContexto.Provider>
  );
};

// Hook personalizado para usar el contexto del ciclo fácilmente
export const usarCiclo = () => {
  const contexto = useContext(CicloContexto);
  if (!contexto) {
    throw new Error('usarCiclo debe ser usado dentro de un ProveedorCiclo');
  }
  return contexto;
};