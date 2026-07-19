import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface WorkspaceSettings {
  id: string;
  organization_name: string | null;
  theme: 'light' | 'dark' | 'system';
  notification_enabled: boolean;
  billing_plan: string;
  data_retention_days: number;
  created_at: string;
  updated_at: string;
}

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly http = inject(HttpClient);
  get(): Observable<WorkspaceSettings> { return this.http.get<WorkspaceSettings>(`${environment.apiUrl}/settings`); }
  update(payload: Partial<WorkspaceSettings>): Observable<WorkspaceSettings> { return this.http.put<WorkspaceSettings>(`${environment.apiUrl}/settings`, payload); }
}
