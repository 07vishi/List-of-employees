import axios, { AxiosInstance } from 'axios';
import { Employee, OdooConfig } from '../types';

type OdooFieldMap = Record<string, unknown>;
type OdooEmployeeRecord = Record<string, unknown> & {
  id: number;
  name: string | false;
};

class OdooService {
  private config: OdooConfig;
  private client: AxiosInstance;
  private uid: number | null = null;
  private employeeFields: OdooFieldMap | null = null;

  constructor(config: OdooConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.url,
      timeout: config.timeout ?? 15000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Authenticate with Odoo using JSON-RPC
   */
  async authenticate(): Promise<boolean> {
    try {
      const uid = await this.callOdoo<number | false>('common', 'login', [
        this.config.db,
        this.config.username,
        this.config.password,
      ]);

      if (uid) {
        this.uid = uid;
        return true;
      }

      return false;
    } catch (error) {
      console.error('Authentication failed:', error);
      throw new Error('Failed to authenticate with Odoo');
    }
  }

  /**
   * Fetch employees from Odoo
   */
  async fetchEmployees(): Promise<Employee[]> {
    try {
      await this.ensureAuthenticated();

      const fields = await this.getEmployeeFieldNames();
      const response = await this.callModel<OdooEmployeeRecord[]>('hr.employee', 'search_read', {
        args: [[]],
        kwargs: {
          fields,
          offset: 0,
          limit: 100,
        },
      });

      return response.map((employee) => this.mapEmployee(employee));
    } catch (error) {
      console.error('Failed to fetch employees:', error);
      throw this.toUserFacingError(error, 'Failed to fetch employees from Odoo');
    }
  }

  /**
   * Search employees by name
   */
  async searchEmployees(searchTerm: string): Promise<Employee[]> {
    try {
      await this.ensureAuthenticated();

      const fields = await this.getEmployeeFieldNames();
      const response = await this.callModel<OdooEmployeeRecord[]>('hr.employee', 'search_read', {
        args: [[['name', 'ilike', searchTerm]]],
        kwargs: {
          fields,
          offset: 0,
          limit: 100,
        },
      });

      return response.map((employee) => this.mapEmployee(employee));
    } catch (error) {
      console.error('Failed to search employees:', error);
      throw this.toUserFacingError(error, 'Failed to search employees');
    }
  }

  /**
   * Get employee details
   */
  async getEmployeeDetails(employeeId: number): Promise<Employee | null> {
    try {
      await this.ensureAuthenticated();

      const fields = await this.getEmployeeFieldNames(['create_date', 'write_date']);
      const response = await this.callModel<OdooEmployeeRecord[]>('hr.employee', 'read', {
        args: [[employeeId]],
        kwargs: {
          fields,
        },
      });

      if (response.length > 0) {
        return this.mapEmployee(response[0]);
      }
      return null;
    } catch (error) {
      console.error('Failed to get employee details:', error);
      throw this.toUserFacingError(error, 'Failed to get employee details');
    }
  }

  /**
   * Clear authentication
   */
  logout(): void {
    this.uid = null;
  }

  private async ensureAuthenticated(): Promise<void> {
    if (this.uid) {
      return;
    }

    const authenticated = await this.authenticate();
    if (!authenticated) {
      throw new Error('Odoo login failed. Check your database, username, and password.');
    }
  }

  private async callModel<T>(
    model: string,
    method: string,
    params: { args?: unknown[]; kwargs?: Record<string, unknown> },
  ): Promise<T> {
    await this.ensureAuthenticated();

    return this.callOdoo<T>('object', 'execute_kw', [
      this.config.db,
      this.uid,
      this.config.password,
      model,
      method,
      params.args ?? [],
      params.kwargs ?? {},
    ]);
  }

  private async callOdoo<T>(service: string, method: string, args: unknown[]): Promise<T> {
    const response = await this.client.post('/jsonrpc', {
      jsonrpc: '2.0',
      method: 'call',
      params: {
        service,
        method,
        args,
      },
      id: Math.random(),
    });

    if (response.data.error) {
      const message =
        response.data.error.data?.message ||
        response.data.error.message ||
        'Odoo returned an error';
      throw new Error(message);
    }

    return response.data.result as T;
  }

  private async getEmployeeFields(): Promise<OdooFieldMap> {
    if (this.employeeFields) {
      return this.employeeFields;
    }

    this.employeeFields = await this.callModel<OdooFieldMap>('hr.employee', 'fields_get', {
      args: [],
      kwargs: {},
    });

    return this.employeeFields;
  }

  private async getEmployeeFieldNames(extraFields: string[] = []): Promise<string[]> {
    const fields = await this.getEmployeeFields();
    const candidates = [
      'id',
      'name',
      'work_email',
      'email',
      'work_phone',
      'phone',
      'image_128',
      'image_1920',
      'job_title',
      'department_id',
      'work_location',
      'work_location_id',
      ...extraFields,
    ];

    return candidates.filter((field) => Object.prototype.hasOwnProperty.call(fields, field));
  }

  private mapEmployee(employee: OdooEmployeeRecord): Employee {
    const email = this.firstString(employee.work_email, employee.email);
    const phone = this.firstString(employee.work_phone, employee.phone);
    const image = this.toImageUri(employee.image_128 || employee.image_1920);
    const workLocation = this.firstString(
      employee.work_location,
      this.many2OneName(employee.work_location_id),
    );

    return {
      id: employee.id,
      name: this.firstString(employee.name) || 'Unnamed employee',
      email,
      phone,
      image,
      job_title: this.firstString(employee.job_title),
      department_id: this.toDepartment(employee.department_id),
      work_location: workLocation,
      create_date: this.firstString(employee.create_date),
      write_date: this.firstString(employee.write_date),
    };
  }

  private firstString(...values: unknown[]): string {
    for (const value of values) {
      if (typeof value === 'string') {
        return value;
      }
    }

    return '';
  }

  private many2OneName(value: unknown): string {
    return Array.isArray(value) && typeof value[1] === 'string' ? value[1] : '';
  }

  private toDepartment(value: unknown): [number, string] | undefined {
    if (
      Array.isArray(value) &&
      typeof value[0] === 'number' &&
      typeof value[1] === 'string'
    ) {
      return [value[0], value[1]];
    }

    return undefined;
  }

  private toImageUri(value: unknown): string {
    if (typeof value !== 'string' || !value) {
      return '';
    }

    if (value.startsWith('data:image')) {
      return value;
    }

    return `data:image/png;base64,${value}`;
  }

  private toUserFacingError(error: unknown, fallback: string): Error {
    if (error instanceof Error) {
      return error;
    }

    return new Error(fallback);
  }
}

export default OdooService;
