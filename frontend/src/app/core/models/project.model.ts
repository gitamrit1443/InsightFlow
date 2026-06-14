export interface Project {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  goal: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectPayload {
  name: string;
  description?: string | null;
  category?: string | null;
  goal?: string | null;
}

export interface ProjectListResponse {
  items: Project[];
  total: number;
  page: number;
  page_size: number;
}
