import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    // Health endpoints: forward the original Terminus body so monitoring tools
    // receive structured { status, info, error, details } instead of our
    // generic error envelope.
    if (request.path?.startsWith('/health') && typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const body = exceptionResponse as Record<string, unknown>;
      if ('status' in body && 'error' in body) {
        response.status(status).json(exceptionResponse);
        return;
      }
    }

    const message = this.resolveMessage(exceptionResponse, exception);

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} → ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }

  private resolveMessage(
    exceptionResponse: string | object | null,
    exception: unknown,
  ): string | string[] {
    if (!exceptionResponse) return 'Internal server error';

    if (typeof exceptionResponse === 'string') return exceptionResponse;

    const res = exceptionResponse as Record<string, unknown>;

    if (Array.isArray(res.message)) return res.message as string[];
    if (typeof res.message === 'string') return res.message;
    if (typeof res.error === 'string') return res.error;

    return exception instanceof Error ? exception.message : 'An error occurred';
  }
}
