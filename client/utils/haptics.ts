import * as Haptics from 'expo-haptics';
export const selection = () => { try { Haptics.selectionAsync(); } catch (e) {} };
export const impactAsync = (style = Haptics.ImpactFeedbackStyle.Medium) => { try { Haptics.impactAsync(style); } catch (e) {} };
export const notificationAsync = (type = Haptics.NotificationFeedbackType.Success) => { try { Haptics.notificationAsync(type); } catch (e) {} };