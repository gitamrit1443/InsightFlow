export interface DashboardWidget {
  type: 'kpi' | 'line' | 'bar' | 'pie' | 'area' | 'table' | string;
  title: string;
  value?: string | number;
  series?: number[];
  labels?: string[];
}

export interface Dashboard {
  id: string;
  name: string;
  layout_config: {
    widgets?: DashboardWidget[];
    [key: string]: unknown;
  };
  created_at: string;
  updated_at: string;
}
