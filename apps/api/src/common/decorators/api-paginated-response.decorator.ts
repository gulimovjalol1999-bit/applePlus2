import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';
import { PaginatedMeta } from '../dto/base-response.dto';

export const ApiPaginatedResponse = <T extends Type>(model: T) =>
  applyDecorators(
    ApiExtraModels(PaginatedMeta, model),
    ApiOkResponse({
      schema: {
        properties: {
          success: { type: 'boolean', example: true },
          data: { type: 'array', items: { $ref: getSchemaPath(model) } },
          meta: { $ref: getSchemaPath(PaginatedMeta) },
        },
      },
    }),
  );
