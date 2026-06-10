import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  Body,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
  UseGuards,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import {
  ApiTags,
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiBody,
  ApiOkResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UploadsService } from './uploads.service';
import { UploadResponseDto } from './dto/upload-response.dto';
import { PresignedUrlQueryDto } from './dto/presigned-url-query.dto';
import { PresignedUrlResponseDto } from './dto/presigned-url-response.dto';
import { ConfirmUploadDto } from './dto/confirm-upload.dto';
import { ConfirmUploadResponseDto } from './dto/confirm-upload-response.dto';
import { MAX_FILE_SIZE, STORAGE_KEY_REGEX } from './uploads.constants';

const IMAGE_TYPE_REGEX = /^image\/(jpeg|jpg|png|webp|gif)$/;

@ApiTags('Uploads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploads: UploadsService) {}

  @Post('image')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiOperation({ summary: 'Upload a single image (max 10 MB)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiCreatedResponse({ type: UploadResponseDto })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_FILE_SIZE } }))
  async uploadImage(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_FILE_SIZE }),
          new FileTypeValidator({ fileType: IMAGE_TYPE_REGEX }),
        ],
      }),
    )
    file: Express.Multer.File,
    @CurrentUser() user: { id: string },
  ): Promise<UploadResponseDto> {
    return this.uploads.uploadSingle(file, 'images', user?.id);
  }

  @Post('images')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Upload up to 10 images at once' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: { type: 'array', items: { type: 'string', format: 'binary' } },
      },
    },
  })
  @ApiCreatedResponse({ type: UploadResponseDto, isArray: true })
  @UseInterceptors(FilesInterceptor('files', 10, { limits: { fileSize: MAX_FILE_SIZE } }))
  async uploadImages(
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser() user: { id: string },
  ): Promise<UploadResponseDto[]> {
    if (!files?.length) throw new BadRequestException('No files provided');
    return this.uploads.uploadMany(files, 'images', user?.id);
  }

  @Get('presigned-url')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Get a presigned URL for direct browser-to-storage upload',
    description:
      'Returns a signed PUT URL valid for 5 minutes. The client PUTs the file directly to MinIO/S3, then stores the returned `key` for future reference.',
  })
  @ApiOkResponse({ type: PresignedUrlResponseDto })
  async getPresignedUrl(
    @Query() query: PresignedUrlQueryDto,
    @CurrentUser() user: { id: string },
  ): Promise<PresignedUrlResponseDto> {
    return this.uploads.getPresignedUploadUrl(
      query.contentType,
      query.filename,
      query.folder,
      query.contentLength,
      user?.id,
    );
  }

  @Post('confirm')
  @ApiOperation({
    summary: 'Confirm a presigned-URL upload',
    description:
      'Call this after successfully PUTing a file to a presigned URL. Verifies the object ' +
      'exists in storage and marks it as confirmed so it is not treated as orphaned.',
  })
  @ApiOkResponse({ type: ConfirmUploadResponseDto })
  async confirmUpload(
    @Body() body: ConfirmUploadDto,
    @CurrentUser() user: { id: string },
  ): Promise<ConfirmUploadResponseDto> {
    return this.uploads.confirmUpload(body.key, user?.id);
  }

  @Delete(':key(*)')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.MANAGER)
  @ApiOperation({ summary: 'Delete a stored file by its storage key (owner/manager only)' })
  async deleteFile(@Param('key') key: string): Promise<{ deleted: string }> {
    if (!STORAGE_KEY_REGEX.test(key)) {
      throw new BadRequestException('Invalid storage key');
    }
    await this.uploads.delete(key);
    return { deleted: key };
  }
}
