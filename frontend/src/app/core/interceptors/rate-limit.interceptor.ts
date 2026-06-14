import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';

export const rateLimitInterceptor: HttpInterceptorFn = (request, next) => {
  const toast = inject(ToastService);
  return next(request).pipe(catchError((error: HttpErrorResponse) => {
    if (error.status === 429) toast.error('Too many requests. Please wait and try again.');
    return throwError(() => error);
  }));
};
