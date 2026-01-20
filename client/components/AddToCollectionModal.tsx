import React from "react";
import { View, Text, Modal, Pressable, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

export default function AddToCollectionModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.title}>Add to Collection</Text>
          <Pressable onPress={onClose} style={styles.btn}>
            <Text style={styles.btnText}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  content: { backgroundColor: '#1E1E2E', padding: 20 },
  title: { color: 'white', fontSize: 18, marginBottom: 20 },
  btn: { backgroundColor: '#4361EE', padding: 15, borderRadius: 10, alignItems: 'center' },
  btnText: { color: 'white' }
});