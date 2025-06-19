import { Box, Button, Modal, SpaceBetween } from '@cloudscape-design/components';
import type { ReactNode } from 'react';

export interface ConfirmModalProps {
  title: string;
  visible: boolean;
  itemId: string;
  updateVisible: (visible: boolean) => void;
  modalAction: (id: string) => Promise<void>;
  children?: ReactNode;
}

const ConfirmModal = ({ title, visible, itemId, updateVisible, modalAction, children }: ConfirmModalProps) => {
  const handleConfirm = () => {
    modalAction(itemId);
    updateVisible(false);
  };

  return (
    <Modal
      header={title}
      visible={visible}
      footer={
        <Box float="right">
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={() => updateVisible(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleConfirm}>
              Confirm
            </Button>
          </SpaceBetween>
        </Box>
      }
    >
      {children}
    </Modal>
  );
};

export default ConfirmModal;
