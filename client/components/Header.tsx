import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';

interface HeaderProps {
  title: string;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightPress?: () => void;
}

const HEADER_CONTENT_HEIGHT = 60;

export function useHeaderHeight(): number {
  const insets = useSafeAreaInsets();
  if (Platform.OS === 'android') {
    return HEADER_CONTENT_HEIGHT + (StatusBar.currentHeight || 24);
  }
  return HEADER_CONTENT_HEIGHT + insets.top;
}

export const Header: React.FC<HeaderProps> = ({ title, rightIcon, onRightPress }) => {
  const insets = useSafeAreaInsets();
  const statusBarHeight = Platform.OS === 'android' 
    ? (StatusBar.currentHeight || 24) 
    : insets.top;

  return (
    <View style={[styles.container, { paddingTop: statusBarHeight }]}>
      <View style={styles.content}>
        <ThemedText style={styles.title}>{title}</ThemedText>
        {rightIcon && (
          <TouchableOpacity 
            onPress={onRightPress} 
            style={styles.iconButton}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <Ionicons name={rightIcon} size={24} color="white" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    width: '100%',
    zIndex: 100,
    elevation: 5,
    backgroundColor: '#000',
    marginTop: 0,
  },
  content: {
    height: HEADER_CONTENT_HEIGHT,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  iconButton: {
    padding: 10,
    zIndex: 999,
  },
});
