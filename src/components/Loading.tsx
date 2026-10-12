import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { colors } from '../theme';

export function Loading() {
  return (
    <View style={styles.wrap}>
      <ActivityIndicator size="large" color={colors.text} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
});
