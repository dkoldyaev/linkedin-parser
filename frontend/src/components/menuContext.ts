import { createContext, useContext } from 'react';

export interface MenuContextValue {
  open: boolean;
  toggle: () => void;
  close: () => void;
}

export const MenuContext = createContext<MenuContextValue>({
  open: false,
  toggle: () => {},
  close: () => {},
});

export function useMenu(): MenuContextValue {
  return useContext(MenuContext);
}
