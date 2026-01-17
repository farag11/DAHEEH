import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import React from 'react';
import { Ionicons } from '@expo/vector-icons'; // Assuming you have @expo/vector-icons installed
import { useTheme } from '../hooks/useTheme';

interface HeaderProps {
  title: string;
  rightIconName?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, rightIconName, onRightIconPress }) => {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.colors.background }]}>
      <View style={styles.titleContainer}>
        <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
      </View>
      {rightIconName && (
        <Pressable
          onPress={onRightIconPress}
          style={({ pressed }) => [{
            opacity: pressed ? 0.6 : 1,
            paddingHorizontal: 16,
            paddingVertical: 8,
          }]}
        >
          <Ionicons name={rightIconName} size={24} color={theme.colors.text} />
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row
  ',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default Header;
