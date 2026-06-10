import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface SuccessResponse<T> {
  success: true;
  data: T;
}

@Injectable()
export class ResponseTransformInterceptor<T>
  implements NestInterceptor<T, SuccessResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<SuccessResponse<T>> {
    // Health endpoints use the Terminus wire format directly — wrapping would
    // break monitoring tools and obscure failure details from the 503 body.
    const req = context.switchToHttp().getRequest<Request>();
    if (req.path?.startsWith('/health')) {
      return next.handle() as Observable<SuccessResponse<T>>;
    }

    return next.handle().pipe(
      map((data) => {
        if (
          data !== null &&
          typeof data === 'object' &&
          'data' in data &&
          'meta' in data &&
          Array.isArray((data as Record<string, unknown>).data)
        ) {
          return { success: true as const, ...(data as Record<string, unknown>) } as SuccessResponse<T>;
        }
        return { success: true as const, data };
      }),
    );
  }
}
