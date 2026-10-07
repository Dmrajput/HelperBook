import { createContext, useContext } from "react";

export const MainTabContext = createContext({ tab: "Home", setTab: () => {} });

export function useMainTab() {
  return useContext(MainTabContext);
}
