import { Module } from '@nestjs/common';
import { PrismaModule } from '@wattweiser/db';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RbacGuard } from './guards/rbac.guard';

@Module({
  imports: [PrismaModule],
  providers: [JwtAuthGuard, RbacGuard],
  exports: [JwtAuthGuard, RbacGuard],
})
export class AuthModule {}
