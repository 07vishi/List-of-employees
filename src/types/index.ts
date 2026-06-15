export interface Employee {
  id: number;
  name: string;
  email: string;
  phone?: string;
  image?: string;
  job_title?: string;
  department_id?: [number, string];
  work_location?: string;
  create_date?: string;
  write_date?: string;
}

export interface OdooConfig {
  url: string;
  db: string;
  username: string;
  password?: string;
  timeout?: number;
}
