import { createContext, useContext } from "react";

const DevPreviewContext = createContext({
  openAppPreview: () => {},
  closeAppPreview: () => {},
});

export function DevPreviewProvider({ children, onOpen, onClose }) {
  return (
    <DevPreviewContext.Provider
      value={{
        openAppPreview: onOpen,
        closeAppPreview: onClose,
      }}
    >
      {children}
    </DevPreviewContext.Provider>
  );
}

export function useDevPreview() {
  return useContext(DevPreviewContext);
}
