
import React from 'react';
import { View, Text } from 'react-native';

interface Toast {
  id: number;
  message: string;
}

interface XPToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}

export const XPToastContainer = ({ toasts, onDismiss }: XPToastContainerProps) => {
  return (
    <View>
      {toasts.map(toast => (
        <Text key={toast.id} onPress={() => onDismiss(toast.id)}>
          {toast.message}
        </Text>
      ))}
    </View>
  );
};
