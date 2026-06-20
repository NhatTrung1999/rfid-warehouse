import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RESPONSE_MESSAGE_KEY } from '../response-message.decorator';

export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

const DEFAULT_MESSAGES: Record<string, string> = {
  POST: 'Tạo thành công',
  GET: 'Lấy dữ liệu thành công',
  PUT: 'Cập nhật thành công',
  PATCH: 'Cập nhật thành công',
  DELETE: 'Xóa thành công',
};

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  constructor(private reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const http = context.switchToHttp();
    const response = http.getResponse();
    const request = http.getRequest();

    const customMessage = this.reflector.get<string>(
      RESPONSE_MESSAGE_KEY,
      context.getHandler(),
    );

    return next.handle().pipe(
      map((data) => ({
        statusCode: response.statusCode,
        message:
          customMessage ?? DEFAULT_MESSAGES[request.method] ?? 'Thành công',
        data: data ?? null,
      })),
    );
  }
}
