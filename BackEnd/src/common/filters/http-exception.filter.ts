import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Formatea todos los errores HTTP con la misma estructura JSON:
 * { statusCode, error, message, path, timestamp }
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus?.() ?? HttpStatus.INTERNAL_SERVER_ERROR;
    const body = exception.getResponse();

    // Le decimos a TypeScript que 'body' es un objeto seguro de leer
    const bodyObj = body as Record<string, unknown>;

    const mensaje =
      typeof body === 'object' && body !== null && 'message' in bodyObj
        ? bodyObj.message
        : exception.message;

    this.logger.warn(
      `[${status}] ${request.method} ${request.url} — ${JSON.stringify(mensaje)}`,
    );

    response.status(status).json({
      statusCode: status,
      error: exception.name,
      message: mensaje,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
