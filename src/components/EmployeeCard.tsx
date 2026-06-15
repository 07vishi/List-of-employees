import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { DirectoryEmployee } from '../types';

type EmployeeCardProps = {
  employee: DirectoryEmployee;
};

function EmployeeCard({ employee }: EmployeeCardProps): React.ReactElement {
  return (
    <View style={styles.card}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{employee.avatar}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.topLine}>
          <Text numberOfLines={1} style={styles.name}>
            {employee.name}
          </Text>
          <Text numberOfLines={1} style={styles.badge}>
            {employee.department}
          </Text>
        </View>
        <Text numberOfLines={1} style={styles.role}>
          {employee.role}
        </Text>
      </View>
    </View>
  );
}

export default memo(EmployeeCard);

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderColor: '#e5e7eb',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    marginHorizontal: 16,
    padding: 14,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: '#dbeafe',
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    marginRight: 12,
    width: 48,
  },
  avatarText: {
    color: '#1d4ed8',
    fontSize: 15,
    fontWeight: '800',
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  topLine: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  name: {
    color: '#111827',
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
  },
  badge: {
    backgroundColor: '#eef2ff',
    borderRadius: 999,
    color: '#3730a3',
    fontSize: 12,
    fontWeight: '800',
    maxWidth: 120,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  role: {
    color: '#6b7280',
    fontSize: 14,
    marginTop: 4,
  },
});
