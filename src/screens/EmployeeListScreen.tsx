import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  RefreshControl,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ODOO_URL,
  ODOO_DB,
  ODOO_USERNAME,
  ODOO_PASSWORD,
  API_TIMEOUT,
} from '@env';
import OdooService from '../services/OdooService';
import { Employee } from '../types';

const getInitials = (name: string): string =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || '?';

const EmployeeListScreen: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [odooService, setOdooService] = useState<OdooService | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState('All');

  const odooConfig = {
    url: ODOO_URL,
    db: ODOO_DB,
    username: ODOO_USERNAME,
    password: ODOO_PASSWORD,
    timeout: Number(API_TIMEOUT) || 15000,
  };

  useEffect(() => {
    initializeService();
  }, []);

  const departments = useMemo(() => {
    const departmentNames = employees
      .map((employee) => employee.department_id?.[1])
      .filter((department): department is string => Boolean(department));

    return ['All', ...Array.from(new Set(departmentNames)).sort()];
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    return employees.filter((employee) => {
      const matchesDepartment =
        selectedDepartment === 'All' || employee.department_id?.[1] === selectedDepartment;
      const matchesSearch =
        !query ||
        employee.name.toLowerCase().includes(query) ||
        employee.email.toLowerCase().includes(query) ||
        employee.phone?.toLowerCase().includes(query) ||
        employee.job_title?.toLowerCase().includes(query) ||
        employee.department_id?.[1].toLowerCase().includes(query);

      return matchesDepartment && matchesSearch;
    });
  }, [employees, searchText, selectedDepartment]);

  const initializeService = async () => {
    try {
      if (!odooConfig.url || !odooConfig.db || !odooConfig.username || !odooConfig.password) {
        throw new Error('Missing Odoo configuration. Check your .env file.');
      }

      setErrorMessage('');
      const service = new OdooService(odooConfig);
      setOdooService(service);
      await loadEmployees(service);
    } catch (error) {
      console.error(error);
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to initialize Odoo connection',
      );
      setLoading(false);
    }
  };

  const loadEmployees = async (service: OdooService) => {
    try {
      setLoading(true);
      setErrorMessage('');
      const data = await service.fetchEmployees();
      setEmployees(data);
      if (
        selectedDepartment !== 'All' &&
        !data.some((employee) => employee.department_id?.[1] === selectedDepartment)
      ) {
        setSelectedDepartment('All');
      }
    } catch (error) {
      console.error(error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Failed to load employees. Please check your credentials and network.',
      );
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (odooService) {
      await loadEmployees(odooService);
    }
    setRefreshing(false);
  };

  const handleRetry = async () => {
    if (odooService) {
      await loadEmployees(odooService);
      return;
    }

    await initializeService();
  };

  const openEmployeeDetails = async (employee: Employee) => {
    setSelectedEmployee(employee);

    if (!odooService) {
      return;
    }

    try {
      setDetailLoading(true);
      const detail = await odooService.getEmployeeDetails(employee.id);
      if (detail) {
        setSelectedEmployee(detail);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeEmployeeDetails = () => {
    setSelectedEmployee(null);
    setDetailLoading(false);
  };

  const renderDetailRow = (label: string, value?: string) => {
    if (!value) {
      return null;
    }

    return (
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    );
  };

  const renderEmployeeItem = ({ item }: { item: Employee }): React.ReactElement => (
    <Pressable style={styles.employeeRow} onPress={() => openEmployeeDetails(item)}>
      <View style={styles.avatar}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.avatarImage} />
        ) : (
          <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
        )}
      </View>

      <View style={styles.employeeInfo}>
        <View style={styles.nameLine}>
          <Text style={styles.employeeName} numberOfLines={1}>
            {item.name}
          </Text>
          {item.department_id && (
            <Text style={styles.departmentBadge} numberOfLines={1}>
              {item.department_id[1]}
            </Text>
          )}
        </View>

        {item.job_title && (
          <Text style={styles.employeeJobTitle} numberOfLines={1}>
            {item.job_title}
          </Text>
        )}

        <View style={styles.metaLine}>
          {!!item.email && (
            <Text style={styles.employeeMeta} numberOfLines={1}>
              {item.email}
            </Text>
          )}
          {item.phone && (
            <Text style={styles.employeeMeta} numberOfLines={1}>
              {item.phone}
            </Text>
          )}
          {item.work_location && (
            <Text style={styles.employeeMeta} numberOfLines={1}>
              {item.work_location}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );

  const EmptyListComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No employees found</Text>
      <Text style={styles.emptyText}>Pull to refresh or try a different search.</Text>
    </View>
  );

  if (loading && employees.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#123b7a" />
          <Text style={styles.loaderText}>Loading employees...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Employees</Text>
        <Text style={styles.subtitle}>
          {filteredEmployees.length} shown from {employees.length} Odoo records
        </Text>
      </View>

      <View style={styles.toolbar}>
        <View style={styles.searchShell}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search employees"
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor="#8e8e93"
          />
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
        >
          {departments.map((department) => {
            const isSelected = department === selectedDepartment;

            return (
              <Pressable
                key={department}
                style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
                onPress={() => setSelectedDepartment(department)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    isSelected && styles.categoryChipTextActive,
                  ]}
                >
                  {department}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {!!errorMessage && (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>Could not load employees</Text>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <Pressable style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      )}

      <FlatList
        data={filteredEmployees}
        renderItem={renderEmployeeItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={EmptyListComponent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />

      <Modal
        animationType="slide"
        visible={!!selectedEmployee}
        presentationStyle="pageSheet"
        onRequestClose={closeEmployeeDetails}
      >
        <SafeAreaView style={styles.detailContainer}>
          <View style={styles.detailTopBar}>
            <Text style={styles.detailTitle}>Employee Details</Text>
            <Pressable style={styles.closeButton} onPress={closeEmployeeDetails}>
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </View>

          {selectedEmployee && (
            <ScrollView contentContainerStyle={styles.detailContent}>
              <View style={styles.detailHero}>
                <View style={styles.detailAvatar}>
                  {selectedEmployee.image ? (
                    <Image source={{ uri: selectedEmployee.image }} style={styles.avatarImage} />
                  ) : (
                    <Text style={styles.detailAvatarText}>
                      {getInitials(selectedEmployee.name)}
                    </Text>
                  )}
                </View>
                <Text style={styles.detailName}>{selectedEmployee.name}</Text>
                {!!selectedEmployee.job_title && (
                  <Text style={styles.detailJobTitle}>{selectedEmployee.job_title}</Text>
                )}
                {detailLoading && (
                  <View style={styles.detailLoadingRow}>
                    <ActivityIndicator size="small" color="#2563eb" />
                    <Text style={styles.detailLoadingText}>Updating details...</Text>
                  </View>
                )}
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Work</Text>
                {renderDetailRow('Department', selectedEmployee.department_id?.[1])}
                {renderDetailRow('Location', selectedEmployee.work_location)}
                {renderDetailRow('Job Title', selectedEmployee.job_title)}
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Contact</Text>
                {renderDetailRow('Email', selectedEmployee.email)}
                {renderDetailRow('Phone', selectedEmployee.phone)}
              </View>

              {(selectedEmployee.create_date || selectedEmployee.write_date) && (
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Odoo Record</Text>
                  {renderDetailRow('Created', selectedEmployee.create_date)}
                  {renderDetailRow('Updated', selectedEmployee.write_date)}
                </View>
              )}
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f7f9',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
    backgroundColor: '#f6f7f9',
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 6,
  },
  toolbar: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#f6f7f9',
  },
  searchShell: {
    backgroundColor: '#e9edf2',
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  searchInput: {
    fontSize: 16,
    color: '#111827',
    paddingVertical: 11,
  },
  categoryList: {
    gap: 8,
    paddingTop: 12,
    paddingRight: 16,
  },
  categoryChip: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  categoryChipActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#4b5563',
  },
  categoryChipTextActive: {
    color: '#fff',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  employeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#eceff3',
  },
  detailContainer: {
    flex: 1,
    backgroundColor: '#f6f7f9',
  },
  detailTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  closeButton: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#eef2ff',
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2563eb',
  },
  detailContent: {
    padding: 16,
    paddingBottom: 32,
  },
  detailHero: {
    alignItems: 'center',
    paddingVertical: 22,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eceff3',
    marginBottom: 14,
  },
  detailAvatar: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: '#e8f0fe',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 14,
  },
  detailAvatarText: {
    color: '#2563eb',
    fontSize: 30,
    fontWeight: '800',
  },
  detailName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
  },
  detailJobTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4b5563',
    marginTop: 5,
    textAlign: 'center',
  },
  detailLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  detailLoadingText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '700',
  },
  detailSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#eceff3',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#6b7280',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  detailRow: {
    paddingVertical: 9,
    borderTopWidth: 1,
    borderTopColor: '#f0f2f5',
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#6b7280',
    marginBottom: 3,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#e8f0fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: '800',
  },
  employeeInfo: {
    flex: 1,
  },
  nameLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  employeeName: {
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },
  departmentBadge: {
    maxWidth: 120,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#eff6ff',
    color: '#1d4ed8',
    fontSize: 11,
    fontWeight: '700',
  },
  employeeJobTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginTop: 3,
  },
  metaLine: {
    marginTop: 5,
    gap: 2,
  },
  employeeMeta: {
    fontSize: 13,
    color: '#6b7280',
  },
  errorBox: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#fff5f5',
    borderWidth: 1,
    borderColor: '#ffd1d1',
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#b00020',
    marginBottom: 4,
  },
  errorText: {
    fontSize: 13,
    color: '#7a1d1d',
    marginBottom: 10,
  },
  retryButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#123b7a',
  },
  retryText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#172033',
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 14,
    color: '#667085',
  },
});

export default EmployeeListScreen;
