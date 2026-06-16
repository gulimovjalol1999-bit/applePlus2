import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';
import { ParseUuidPipe } from '../../common/pipes/parse-uuid.pipe';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { ProductFilterDto } from './dto/product-filter.dto';
import { ProductResponseDto } from './dto/product-response.dto';
import { CreateProductVariantDto } from './dto/create-product-variant.dto';
import { UpdateProductVariantDto } from './dto/update-product-variant.dto';
import { CreateProductImageDto } from './dto/create-product-image.dto';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'List products (paginated, filterable)' })
  @ApiOkResponse({ type: ProductResponseDto, isArray: true })
  findAll(@Query() filter: ProductFilterDto) {
    return this.productsService.findAll(filter);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get product by slug (public)' })
  @ApiOkResponse({ type: ProductResponseDto })
  findBySlug(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product detail with variants and images' })
  @ApiOkResponse({ type: ProductResponseDto })
  findOne(@Param('id', ParseUuidPipe) id: string) {
    return this.productsService.findOne(id);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.MANAGER)
  @ApiOperation({ summary: 'Create a new product' })
  @ApiCreatedResponse({ type: ProductResponseDto })
  create(
    @Body() dto: CreateProductDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.productsService.create(dto, user?.id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.MANAGER)
  @ApiOperation({ summary: 'Update product fields' })
  @ApiOkResponse({ type: ProductResponseDto })
  update(
    @Param('id', ParseUuidPipe) id: string,
    @Body() dto: UpdateProductDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.productsService.update(id, dto, user?.id);
  }

  @Patch(':id/status')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.MANAGER)
  @ApiOperation({ summary: 'Update product publish status (DRAFT / ACTIVE / ARCHIVED)' })
  @ApiOkResponse({ type: ProductResponseDto })
  updateStatus(
    @Param('id', ParseUuidPipe) id: string,
    @Body() body: UpdateStatusDto,
  ) {
    return this.productsService.updateStatus(id, body.status);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a product' })
  @ApiNoContentResponse()
  remove(@Param('id', ParseUuidPipe) id: string) {
    return this.productsService.remove(id);
  }

  @Post(':id/variants')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.MANAGER)
  @ApiOperation({ summary: 'Add a variant to a product' })
  @ApiCreatedResponse({ type: ProductResponseDto })
  createVariant(
    @Param('id', ParseUuidPipe) id: string,
    @Body() dto: CreateProductVariantDto,
  ) {
    return this.productsService.createVariant(id, dto);
  }

  @Patch(':id/variants/:variantId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.MANAGER)
  @ApiOperation({ summary: 'Update a product variant' })
  @ApiOkResponse({ type: ProductResponseDto })
  updateVariant(
    @Param('id', ParseUuidPipe) id: string,
    @Param('variantId', ParseUuidPipe) variantId: string,
    @Body() dto: UpdateProductVariantDto,
  ) {
    return this.productsService.updateVariant(id, variantId, dto);
  }

  @Delete(':id/variants/:variantId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.MANAGER)
  @ApiOperation({ summary: 'Soft-delete a product variant' })
  @ApiOkResponse({ type: ProductResponseDto })
  removeVariant(
    @Param('id', ParseUuidPipe) id: string,
    @Param('variantId', ParseUuidPipe) variantId: string,
  ) {
    return this.productsService.removeVariant(id, variantId);
  }

  @Post(':id/images')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.MANAGER)
  @ApiOperation({ summary: 'Add an image to a product' })
  @ApiCreatedResponse({ type: ProductResponseDto })
  createImage(
    @Param('id', ParseUuidPipe) id: string,
    @Body() dto: CreateProductImageDto,
  ) {
    return this.productsService.createImage(id, dto);
  }

  @Delete(':id/images/:imageId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.MANAGER)
  @ApiOperation({ summary: 'Delete a product image' })
  @ApiOkResponse({ type: ProductResponseDto })
  removeImage(
    @Param('id', ParseUuidPipe) id: string,
    @Param('imageId', ParseUuidPipe) imageId: string,
  ) {
    return this.productsService.removeImage(id, imageId);
  }
}
