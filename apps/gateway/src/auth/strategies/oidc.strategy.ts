import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-oauth2';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OidcStrategy extends PassportStrategy(Strategy, 'oidc') {
  constructor(
    // @ts-expect-error - Used in super() call, but TypeScript doesn't detect it
    private configService: ConfigService
  ) {
    super({
      authorizationURL: configService.get<string>('OIDC_AUTHORIZATION_URL'),
      tokenURL: configService.get<string>('OIDC_TOKEN_URL'),
      clientID: configService.get<string>('OIDC_CLIENT_ID'),
      clientSecret: configService.get<string>('OIDC_CLIENT_SECRET'),
      callbackURL: configService.get<string>('OIDC_CALLBACK_URL'),
    });
  }

  async validate(accessToken: string, _refreshToken: string, profile: any) {
    return {
      id: profile.id,
      email: profile.email,
      accessToken,
    };
  }
}
