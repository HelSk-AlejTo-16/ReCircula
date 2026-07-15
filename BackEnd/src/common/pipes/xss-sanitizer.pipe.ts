/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, PipeTransform, ArgumentMetadata } from '@nestjs/common';

/**
 * Pipe global para sanitizar entradas tipo string contra ataques XSS.
 * Recorre recursivamente el payload (body) y elimina cualquier etiqueta HTML o bloque de script.
 */
@Injectable()
export class XssSanitizerPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    // Solo sanitizamos si la entrada proviene del Body
    if (metadata.type !== 'body') {
      return value;
    }
    return this.sanitize(value);
  }

  private sanitize(value: any): any {
    if (value === null || value === undefined) {
      return value;
    }

    if (typeof value === 'string') {
      // 1. Elimina etiquetas <script> y su contenido
      let clean = value.replace(
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        '',
      );
      // 2. Elimina cualquier otra etiqueta HTML (ej. <img onerror=...>)
      clean = clean.replace(/<[^>]*>/g, '');
      return clean.trim();
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.sanitize(item));
    }

    if (typeof value === 'object') {
      const cleanObj: Record<string, any> = {};
      for (const key in value) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
          cleanObj[key] = this.sanitize(value[key]);
        }
      }
      return cleanObj;
    }

    return value;
  }
}
