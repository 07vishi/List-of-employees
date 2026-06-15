import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getLoggedInEmail } from '../../src/state/session';

export default function ProfileScreen(): React.ReactElement {
  const email = getLoggedInEmail() || 'No email saved yet';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Perfil em construção</Text>
        <Text style={styles.label}>Logged in as</Text>
        <Text style={styles.email}>{email}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f8fb',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderColor: '#e5e7eb',
    borderRadius: 8,
    borderWidth: 1,
    padding: 24,
  },
  title: {
    color: '#111827',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 22,
  },
  label: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  email: {
    color: '#2563eb',
    fontSize: 18,
    fontWeight: '700',
  },
});
