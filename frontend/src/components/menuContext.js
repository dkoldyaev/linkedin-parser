import { createContext, useContext } from 'react';

export const MenuContext = createContext({ open: false, toggle: () => {}, close: () => {} });

export function useMenu() {
  return useContext(MenuContext);
}
