import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Project, ProjectListResponse, ProjectPayload } from '../models/project.model';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private readonly http = inject(HttpClient);

  list(search = ''): Observable<ProjectListResponse> {
    const params = search ? new HttpParams().set('search', search) : undefined;
    return this.http.get<ProjectListResponse>(`${environment.apiUrl}/projects`, { params });
  }
  get(id: string): Observable<Project> { return this.http.get<Project>(`${environment.apiUrl}/projects/${id}`); }
  create(payload: ProjectPayload): Observable<Project> { return this.http.post<Project>(`${environment.apiUrl}/projects`, payload); }
  update(id: string, payload: Partial<ProjectPayload>): Observable<Project> { return this.http.put<Project>(`${environment.apiUrl}/projects/${id}`, payload); }
  delete(id: string): Observable<void> { return this.http.delete<void>(`${environment.apiUrl}/projects/${id}`); }
}
