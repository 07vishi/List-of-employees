import { Pressable, StyleSheet, Text } from 'react-native';

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
};

export default function PrimaryButton({
  label,
  onPress,
}: PrimaryButtonProps): React.ReactElement {
  return (
    <Pressable style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]} onPress={onPress}>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  buttonPressed: {
    opacity: 0.82,
  },
  label: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
});
