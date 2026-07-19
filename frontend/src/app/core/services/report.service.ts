import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Report } from '../models/report.model';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly http = inject(HttpClient);
  list(projectId: string): Observable<Report[]> { return this.http.get<Report[]>(`${environment.apiUrl}/projects/${projectId}/reports`); }
  get(id: string): Observable<Report> { return this.http.get<Report>(`${environment.apiUrl}/reports/${id}`); }
  generate(projectId: string, title?: string): Observable<Report> { return this.http.post<Report>(`${environment.apiUrl}/projects/${projectId}/reports/generate`, { title: title || null }); }
  delete(id: string): Observable<void> { return this.http.delete<void>(`${environment.apiUrl}/reports/${id}`); }
}
