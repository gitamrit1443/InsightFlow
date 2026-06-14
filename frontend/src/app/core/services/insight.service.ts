import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Insight } from '../models/insight.model';

@Injectable({ providedIn: 'root' })
export class InsightService {
  private readonly http = inject(HttpClient);
  list(projectId: string): Observable<Insight[]> { return this.http.get<Insight[]>(`${environment.apiUrl}/projects/${projectId}/insights`); }
  generate(projectId: string): Observable<Insight[]> { return this.http.post<Insight[]>(`${environment.apiUrl}/projects/${projectId}/insights/generate`, {}); }
  save(projectId: string, payload: Partial<Insight>): Observable<Insight> { return this.http.post<Insight>(`${environment.apiUrl}/projects/${projectId}/insights`, payload); }
  delete(id: string): Observable<void> { return this.http.delete<void>(`${environment.apiUrl}/insights/${id}`); }
}
