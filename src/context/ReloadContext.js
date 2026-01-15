
import React, { createContext, useContext, useState } from 'react';

// Crear el contexto
const ReloadContext = createContext();

export const useReload = () => useContext(ReloadContext);

// Proveedor del contexto
export const ReloadProvider = ({ children }) => {
  const [reloadKey, setReloadKey] = useState(0);

  const triggerReload = () => {
    setReloadKey(prevKey => prevKey + 1); // Incrementar reloadKey para forzar recarga
  };



  return (
    <ReloadContext.Provider value={{ reloadKey, triggerReload }}>
      {children}
    </ReloadContext.Provider>
  );
};
