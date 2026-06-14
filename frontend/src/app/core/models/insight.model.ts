export interface Insight {
  id: string;
  project_id: string;
  type: string;
  title: string;
  content: string;
  confidence_score: number | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}
