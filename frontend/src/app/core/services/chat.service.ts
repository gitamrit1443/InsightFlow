import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ChatMessage, ChatResponse } from '../models/chat.model';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly http = inject(HttpClient);
  history(projectId: string): Observable<ChatMessage[]> { return this.http.get<ChatMessage[]>(`${environment.apiUrl}/projects/${projectId}/chat`); }
  send(projectId: string, question: string): Observable<ChatResponse> { return this.http.post<ChatResponse>(`${environment.apiUrl}/projects/${projectId}/chat`, { question }); }
}
