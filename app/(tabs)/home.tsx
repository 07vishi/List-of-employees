import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import EmployeeCard from '../../src/components/EmployeeCard';
import { employees } from '../../src/data/employees';
import { DirectoryEmployee } from '../../src/types';

const renderEmployee = ({ item }: { item: DirectoryEmployee }): React.ReactElement => (
  <EmployeeCard employee={item} />
);

const renderSeparator = (): React.ReactElement => <View style={styles.separator} />;

const keyExtractor = (item: DirectoryEmployee): string => item.id;

function ListHeader(): React.ReactElement {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>Collaborators</Text>
      <Text style={styles.subtitle}>Browse your Week 2 mocked team directory.</Text>
    </View>
  );
}

function EmptyList(): React.ReactElement {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>Nenhum colaborador encontrado</Text>
    </View>
  );
}

export default function HomeScreen(): React.ReactElement {
  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <FlatList
        contentContainerStyle={styles.listContent}
        data={employees}
        ItemSeparatorComponent={renderSeparator}
        keyExtractor={keyExtractor}
        ListEmptyComponent={EmptyList}
        ListHeaderComponent={ListHeader}
        renderItem={renderEmployee}
        stickyHeaderIndices={[0]}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f8fb',
  },
  listContent: {
    paddingBottom: 24,
  },
  header: {
    backgroundColor: '#f7f8fb',
    paddingHorizontal: 20,
    paddingBottom: 18,
    paddingTop: 18,
  },
  title: {
    color: '#111827',
    fontSize: 32,
    fontWeight: '800',
  },
  subtitle: {
    color: '#6b7280',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 6,
  },
  separator: {
    height: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '700',
  },
});
