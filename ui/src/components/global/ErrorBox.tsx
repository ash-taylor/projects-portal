import Alert from '@cloudscape-design/components/alert';
import Button from '@cloudscape-design/components/button';
import type { ReactNode } from 'react';

export interface ErrorBoxProps {
  error: string | { message: string };
  dismissible?: boolean;
  onDismiss?: () => void;
  onRetry?: () => Promise<void>;
}

export const ErrorBox = ({ error, onRetry, dismissible = true, onDismiss }: ErrorBoxProps) => {
  const handleRetry = () => {
    Promise.resolve()
      .then(() => onRetry!())
      .catch(() => {
        /* ignore */
      });
  };

  const defaultMessage = 'Hmm... something went wrong';
  const rawMessage = error || defaultMessage;
  const message = typeof rawMessage === 'string' ? rawMessage : (rawMessage?.message ?? defaultMessage);
  const shouldRetry = !!onRetry;

  let action: ReactNode = undefined;
  if (shouldRetry) {
    action = <Button onClick={handleRetry}>Retry</Button>;
  }

  return (
    <Alert
      i18nStrings={{ infoIconAriaLabel: 'Error' }}
      type="error"
      header="A problem was encountered"
      action={action}
      dismissible={dismissible}
      onDismiss={onDismiss}
    >
      {message}
    </Alert>
  );
};
