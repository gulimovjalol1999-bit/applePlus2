import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
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
import { UploadsService } from './uploads.service';
import { UploadResponseDto } from './dto/upload-response.dto';
import { PresignedUrlQueryDto } from './dto/presigned-url-query.dto';
import { PresignedUrlResponseDto } from './dto/presigned-url-response.dto';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const IMAGE_TYPE_REGEX = /image\/(jpeg|jpg|png|webp|gif)/;

@ApiTags('Uploads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploads: UploadsService) {}

  @Post('image')
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
  ): Promise<UploadResponseDto> {
    return this.uploads.uploadSingle(file, 'images');
  }

  @Post('images')
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
  ): Promise<UploadResponseDto[]> {
    if (!files?.length) throw new BadRequestException('No files provided');
    return this.uploads.uploadMany(files, 'images');
  }

  @Get('presigned-url')
  @ApiOperation({
    summary: 'Get a presigned URL for direct browser-to-storage upload',
    description:
      'Returns a signed PUT URL valid for 5 minutes. The client PUTs the file directly to MinIO/S3, then stores the returned `key` for future reference.',
  })
  @ApiOkResponse({ type: PresignedUrlResponseDto })
  async getPresignedUrl(
    @Query() query: PresignedUrlQueryDto,
  ): Promise<PresignedUrlResponseDto> {
    return this.uploads.getPresignedUploadUrl(
      query.filename,
      query.contentType,
      query.folder,
    );
  }

  @Delete(':key(*)')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a stored file by its storage key' })
  async deleteFile(@Param('key') key: string): Promise<{ deleted: string }> {
    await this.uploads.delete(key);
    return { deleted: key };
  }
}
