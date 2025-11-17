import { createContext } from "react";

const initialState = {
  theme: "system",
  setTheme: () => null,
  effectiveTheme: "light",
};

export const ThemeProviderContext = createContext(initialState);



