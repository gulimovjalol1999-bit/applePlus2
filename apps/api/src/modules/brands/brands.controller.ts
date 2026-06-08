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
import { BrandsService } from './brands.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { BrandFilterDto } from './dto/brand-filter.dto';
import { BrandResponseDto } from './dto/brand-response.dto';

@ApiTags('Brands')
@Controller('brands')
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Get()
  @ApiOperation({ summary: 'List brands (paginated)' })
  @ApiOkResponse({ type: BrandResponseDto, isArray: true })
  findAll(@Query() filter: BrandFilterDto) {
    return this.brandsService.findAll(filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get brand by ID' })
  @ApiOkResponse({ type: BrandResponseDto })
  findOne(@Param('id', ParseUuidPipe) id: string) {
    return this.brandsService.findOne(id);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.MANAGER)
  @ApiOperation({ summary: 'Create brand' })
  @ApiCreatedResponse({ type: BrandResponseDto })
  create(
    @Body() dto: CreateBrandDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.brandsService.create(dto, user?.id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.MANAGER)
  @ApiOperation({ summary: 'Update brand' })
  @ApiOkResponse({ type: BrandResponseDto })
  update(
    @Param('id', ParseUuidPipe) id: string,
    @Body() dto: UpdateBrandDto,
  ) {
    return this.brandsService.update(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete brand' })
  @ApiNoContentResponse()
  remove(@Param('id', ParseUuidPipe) id: string) {
    return this.brandsService.remove(id);
  }
}
