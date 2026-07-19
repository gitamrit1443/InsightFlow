export type FileStatus = 'uploaded' | 'processing' | 'parsed' | 'failed';

export interface DocumentAnalysis {
  status: string;
  embedding_backend: 'tensorflow-transformer' | 'tfidf-fallback' | 'none';
  embedding_model: string;
  chunk_count: number;
  word_count: number;
  summary: string;
  keywords: Array<{ term: string; count: number }>;
  entities: Array<{ text: string; count: number }>;
  sentiment: {
    label: 'positive' | 'negative' | 'neutral';
    score: number;
    positive_signals: number;
    negative_signals: number;
  };
}

export interface ParsedFileData {
  row_count?: number;
  column_count?: number;
  columns?: string[];
  preview?: Array<Record<string, unknown>>;
  document_analysis?: DocumentAnalysis;
  analytics?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface UploadedDataFile {
  id: string;
  project_id: string;
  file_name: string;
  original_name: string;
  file_type: string;
  file_size: number;
  status: FileStatus;
  extracted_text: string | null;
  parsed_data: ParsedFileData | unknown[] | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}
