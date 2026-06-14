import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Dashboard } from '../models/dashboard.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  list(projectId: string): Observable<Dashboard[]> { return this.http.get<Dashboard[]>(`${environment.apiUrl}/projects/${projectId}/dashboards`); }
  generate(projectId: string): Observable<Dashboard> { return this.http.post<Dashboard>(`${environment.apiUrl}/projects/${projectId}/dashboards/generate`, {}); }
  create(projectId: string, payload: Partial<Dashboard>): Observable<Dashboard> { return this.http.post<Dashboard>(`${environment.apiUrl}/projects/${projectId}/dashboards`, payload); }
  update(id: string, payload: Partial<Dashboard>): Observable<Dashboard> { return this.http.put<Dashboard>(`${environment.apiUrl}/dashboards/${id}`, payload); }
  delete(id: string): Observable<void> { return this.http.delete<void>(`${environment.apiUrl}/dashboards/${id}`); }
}
