import type { ReactNode } from 'react';

export const FullPageCenteredBoxLayout = ({ children }: { children: ReactNode }) => (
  <div
    style={{
      display: 'flex',
      minHeight: '100vh',
      alignContent: 'center',
      justifyContent: 'center',
      alignItems: 'center',
    }}
  >
    <div
      style={{
        width: 500,
        height: 500,
      }}
    >
      {children}
    </div>
  </div>
);
