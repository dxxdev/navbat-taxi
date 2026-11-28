import { Button, Dialog, Portal, Text } from "react-native-paper";

type Props = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

// Web va Android'da bir xil ishlaydigan tasdiqlash oynasi (Alert.alert o'rniga)
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel,
  loading = false,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Portal>
      <Dialog visible={visible} onDismiss={loading ? undefined : onCancel}>
        <Dialog.Title>{title}</Dialog.Title>
        <Dialog.Content>
          <Text variant="bodyLarge">{message}</Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button
            onPress={onCancel}
            disabled={loading}
            contentStyle={{ height: 52, paddingHorizontal: 8 }}
          >
            {cancelLabel}
          </Button>
          <Button
            mode="contained"
            onPress={onConfirm}
            loading={loading}
            disabled={loading}
            contentStyle={{ height: 52, paddingHorizontal: 8 }}
          >
            {confirmLabel}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}