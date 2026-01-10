import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { PrismaModule } from '@wattweiser/db';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
// OidcStrategy wird nicht verwendet - wir verwenden Keycloak mit JWKS
// import { OidcStrategy } from './strategies/oidc.strategy';
import { KeycloakService } from './keycloak.service';
import { TokenBlacklistService } from './token-blacklist.service';
import { JwtVerifyService } from './jwt-verify';
import { AuthMiddleware } from './auth.middleware';
import { RbacGuard } from './guards/rbac.guard';

@Module({
  imports: [
    PrismaModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.get<string>('JWT_EXPIRES_IN', '1h'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    // OidcStrategy entfernt - wird nicht benötigt (Keycloak mit JWKS)
    KeycloakService,
    TokenBlacklistService,
    JwtVerifyService,
    AuthMiddleware,
    RbacGuard,
  ],
  exports: [AuthService, TokenBlacklistService, JwtVerifyService, AuthMiddleware, RbacGuard],
})
export class AuthModule {}
