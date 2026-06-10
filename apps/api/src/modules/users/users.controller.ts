import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';
import { ParseUuidPipe } from '../../common/pipes/parse-uuid.pipe';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UserResponseDto } from './dto/user-response.dto';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get own profile' })
  @ApiOkResponse({ type: UserResponseDto })
  async getOwnProfile(@CurrentUser() user: { id: string }): Promise<UserResponseDto> {
    const found = await this.usersService.findByIdOrThrow(user.id);
    return this.usersService.toResponseDto(found);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update own profile' })
  @ApiOkResponse({ type: UserResponseDto })
  async updateOwnProfile(
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateProfileDto,
  ): Promise<UserResponseDto> {
    const updated = await this.usersService.updateProfile(user.id, dto);
    return this.usersService.toResponseDto(updated);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER, Role.MANAGER, Role.OPERATOR)
  @ApiOperation({ summary: 'Get any user by ID' })
  @ApiOkResponse({ type: UserResponseDto })
  async findOne(@Param('id', ParseUuidPipe) id: string): Promise<UserResponseDto> {
    const found = await this.usersService.findByIdOrThrow(id);
    return this.usersService.toResponseDto(found);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER, Role.MANAGER)
  @ApiOperation({ summary: 'Update any user' })
  @ApiOkResponse({ type: UserResponseDto })
  async update(
    @Param('id', ParseUuidPipe) id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: { id: string; role: Role },
  ): Promise<UserResponseDto> {
    if (dto.isActive === false && id === user.id) {
      throw new BadRequestException('Cannot deactivate your own account');
    }
    const updated = await this.usersService.updateByAdmin(id, dto, user.role);
    return this.usersService.toResponseDto(updated);
  }

  @Patch(':id/role')
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER)
  @ApiOperation({ summary: 'Change user role' })
  @ApiOkResponse({ type: UserResponseDto })
  async updateRole(
    @Param('id', ParseUuidPipe) id: string,
    @Body() dto: UpdateUserRoleDto,
    @CurrentUser() user: { id: string },
  ): Promise<UserResponseDto> {
    if (id === user.id) {
      throw new BadRequestException('Cannot change your own role');
    }
    const updated = await this.usersService.updateRole(id, dto.role);
    return this.usersService.toResponseDto(updated);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete any user' })
  @ApiNoContentResponse()
  async remove(@Param('id', ParseUuidPipe) id: string, @CurrentUser() user: { id: string }): Promise<void> {
    if (id === user.id) {
      throw new BadRequestException('Cannot delete your own account');
    }
    await this.usersService.softDelete(id);
  }
}
