// src/context/LoaderContext.js
import { createContext, useContext, useEffect, useState } from "react";
import { loaderControl } from "../utils/loaderControl"; // 👈 ye utility loader ke liye

const LoaderContext = createContext();

export const LoaderProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loaderControl.register(setLoading); // register karo
  }, []);

  return (
    <LoaderContext.Provider value={{ loading, setLoading }}>
      {children}
    </LoaderContext.Provider>
  );
};

export const useLoader = () => useContext(LoaderContext);
