import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const Header = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Daheeh App</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 15, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: '#333' },
  text: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
});