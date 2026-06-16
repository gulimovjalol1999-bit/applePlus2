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
import { ApiPaginatedResponse } from '../../common/decorators/api-paginated-response.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';
import { ParseUuidPipe } from '../../common/pipes/parse-uuid.pipe';
import { UsedPhonesService } from './used-phones.service';
import { CreateUsedPhoneDto } from './dto/create-used-phone.dto';
import { MarkUsedPhoneSoldResponseDto } from './dto/mark-used-phone-sold-response.dto';
import { UpdateUsedPhoneDto } from './dto/update-used-phone.dto';
import { UsedPhoneFilterDto } from './dto/used-phone-filter.dto';
import { UsedPhoneResponseDto } from './dto/used-phone-response.dto';

@ApiTags('Used Phones')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.OWNER, Role.MANAGER)
@Controller('used-phones')
export class UsedPhonesController {
  constructor(private readonly usedPhonesService: UsedPhonesService) {}

  @Get()
  @ApiOperation({ summary: 'List used phones (paginated, filterable)' })
  @ApiPaginatedResponse(UsedPhoneResponseDto)
  findAll(@Query() filter: UsedPhoneFilterDto) {
    return this.usedPhonesService.findAll(filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get used phone detail' })
  @ApiOkResponse({ type: UsedPhoneResponseDto })
  findOne(@Param('id', ParseUuidPipe) id: string) {
    return this.usedPhonesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a used phone listing (product + variant + inventory + details)' })
  @ApiCreatedResponse({ type: UsedPhoneResponseDto })
  create(
    @Body() dto: CreateUsedPhoneDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.usedPhonesService.create(dto, user?.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a used phone listing' })
  @ApiOkResponse({ type: UsedPhoneResponseDto })
  update(
    @Param('id', ParseUuidPipe) id: string,
    @Body() dto: UpdateUsedPhoneDto,
  ) {
    return this.usedPhonesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a used phone listing' })
  @ApiNoContentResponse()
  remove(@Param('id', ParseUuidPipe) id: string) {
    return this.usedPhonesService.remove(id);
  }

  @Patch(':id/mark-sold')
  @ApiOperation({ summary: 'Mark a used phone as sold (sets inventory to 0, archives the listing)' })
  @ApiOkResponse({ type: MarkUsedPhoneSoldResponseDto })
  markSold(@Param('id', ParseUuidPipe) id: string) {
    return this.usedPhonesService.markSold(id);
  }
}
