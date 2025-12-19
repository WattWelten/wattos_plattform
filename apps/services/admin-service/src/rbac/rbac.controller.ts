import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { RbacService } from './rbac.service';
import { CreateRoleDto, UpdateRoleDto, AssignRoleDto } from './dto/rbac.dto';

@Controller('rbac')
export class RbacController {
  constructor(private readonly rbacService: RbacService) {}

  @Post('roles')
  async createRole(@Query('tenantId') tenantId: string, @Body() dto: CreateRoleDto) {
    return this.rbacService.createRole(tenantId, dto);
  }

  @Get('roles')
  async listRoles(@Query('tenantId') tenantId: string) {
    return this.rbacService.listRoles(tenantId);
  }

  @Get('roles/:roleId')
  async getRole(@Param('roleId') roleId: string) {
    return this.rbacService.getRole(roleId);
  }

  @Put('roles/:roleId')
  async updateRole(@Param('roleId') roleId: string, @Body() dto: UpdateRoleDto) {
    return this.rbacService.updateRole(roleId, dto);
  }

  @Delete('roles/:roleId')
  async deleteRole(@Param('roleId') roleId: string) {
    return this.rbacService.deleteRole(roleId);
  }

  @Post('assign')
  async assignRole(@Body() dto: AssignRoleDto) {
    return this.rbacService.assignRole(dto.userId, dto.roleId);
  }

  @Get('permissions/check')
  async checkPermission(
    @Query('userId') userId: string,
    @Query('permission') permission: string,
  ) {
    const hasPermission = await this.rbacService.checkPermission(userId, permission);
    return { hasPermission };
  }
}


