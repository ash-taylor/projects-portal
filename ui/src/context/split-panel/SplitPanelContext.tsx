import { type ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

type SplitPanelContextType = {
  header: string;
  content: ReactNode;
  updateHeader: (header: string) => void;
  updateContent: (content: ReactNode) => void;
  openSplitPanel: () => void;
  closeSplitPanel: () => void;
  open: boolean;
};

const SplitPanelContext = createContext<SplitPanelContextType>({
  header: '',
  content: null,
  updateHeader: () => {},
  updateContent: () => {},
  openSplitPanel: () => {},
  closeSplitPanel: () => {},
  open: false,
});

export const SplitPanelProvider = ({ children }: { children: ReactNode }) => {
  const location = useLocation();

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    setOpen(false);
    setHeader('');
    setContent(null);
  }, [location.pathname]);

  const [open, setOpen] = useState(false);
  const [header, setHeader] = useState<string>('');
  const [content, setContent] = useState<ReactNode>(null);

  const updateHeader = (header: string) => setHeader(header);

  const openSplitPanel = () => setOpen(true);

  const updateContent = (content: ReactNode) => setContent(content);

  const closeSplitPanel = () => setOpen(false);

  return (
    <SplitPanelContext.Provider
      value={{
        header,
        updateHeader,
        content,
        updateContent,
        openSplitPanel,
        closeSplitPanel,
        open,
      }}
    >
      {children}
    </SplitPanelContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useSplitPanel = () => {
  const ctx = useContext(SplitPanelContext);
  if (!ctx) throw new Error('useSplitPanel must be used within a SplitPanelProvider');
  return ctx;
};
