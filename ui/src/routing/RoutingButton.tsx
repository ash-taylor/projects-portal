import Button, { type ButtonProps } from '@cloudscape-design/components/button';
import { useNavigate } from 'react-router-dom';

export type RoutingButtonProps = Omit<ButtonProps, 'onFollow'> & { href: string };

export const RoutingButton = ({ children, href, ...props }: RoutingButtonProps) => {
  const navigate = useNavigate();

  return (
    <Button
      href={href}
      onFollow={(event) => {
        event.preventDefault();
        navigate(href);
      }}
      {...props}
    >
      {children}
    </Button>
  );
};
