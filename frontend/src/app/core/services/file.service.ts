import { HttpClient, HttpEvent } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UploadedDataFile } from '../models/file.model';

@Injectable({ providedIn: 'root' })
export class FileService {
  private readonly http = inject(HttpClient);
  list(projectId: string): Observable<UploadedDataFile[]> { return this.http.get<UploadedDataFile[]>(`${environment.apiUrl}/projects/${projectId}/files`); }
  get(fileId: string): Observable<UploadedDataFile> { return this.http.get<UploadedDataFile>(`${environment.apiUrl}/files/${fileId}`); }
  upload(projectId: string, file: File): Observable<HttpEvent<UploadedDataFile>> {
    const body = new FormData();
    body.append('file', file);
    return this.http.post<UploadedDataFile>(`${environment.apiUrl}/projects/${projectId}/files/upload`, body, { observe: 'events', reportProgress: true });
  }
  process(fileId: string): Observable<UploadedDataFile> { return this.http.post<UploadedDataFile>(`${environment.apiUrl}/files/${fileId}/process`, {}); }
  delete(fileId: string): Observable<void> { return this.http.delete<void>(`${environment.apiUrl}/files/${fileId}`); }
}
