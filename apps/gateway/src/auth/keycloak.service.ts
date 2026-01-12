import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class KeycloakService {
  private readonly logger = new Logger(KeycloakService.name);
  private keycloakUrl: string;
  private realm: string;
  private clientId: string;
  private clientSecret: string;

  constructor(private configService: ConfigService) {
    this.keycloakUrl = this.configService.get<string>('KEYCLOAK_URL', 'http://localhost:8080');
    this.realm = this.configService.get<string>('KEYCLOAK_REALM', 'wattos');
    this.clientId = this.configService.get<string>('KEYCLOAK_CLIENT_ID', 'gateway');
    this.clientSecret = this.configService.get<string>('KEYCLOAK_CLIENT_SECRET', 'gateway-secret');
    
    // Debug: Zeige geladene Konfiguration
    this.logger.debug(`Keycloak configuration: ${this.keycloakUrl}/realms/${this.realm}, client: ${this.clientId}`);
  }

  async login(username: string, password: string) {
    const url = `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/token`;
    
    this.logger.debug(`Keycloak login URL: ${url}`);
    this.logger.debug(`Using client: ${this.clientId}`);

    const params = new URLSearchParams();
    params.append('grant_type', 'password');
    params.append('client_id', this.clientId);
    params.append('client_secret', this.clientSecret);
    params.append('username', username);
    params.append('password', password);

    try {
      const response = await axios.post(url, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      this.logger.debug('Keycloak login successful');
      return response.data;
    } catch (error) {
      this.logger.error(`Keycloak login failed: ${error instanceof Error ? error.message : String(error)}`);
      if (error instanceof Error && 'response' in error) {
        const axiosError = error as any;
        if (axiosError.response) {
          this.logger.error(`Keycloak response data: ${JSON.stringify(axiosError.response.data)}`);
          this.logger.error(`Keycloak response status: ${axiosError.response.status}`);
        }
        if (axiosError.request) {
          this.logger.error(`Keycloak request failed - no response received. URL: ${url}`);
        }
      }
      throw error;
    }
  }

  async getUserInfo(accessToken: string) {
    const url = `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/userinfo`;

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return response.data;
  }

  async validateToken(token: string) {
    const url = `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/token/introspect`;

    const params = new URLSearchParams();
    params.append('token', token);
    params.append('client_id', this.clientId);
    params.append('client_secret', this.clientSecret);

    const response = await axios.post(url, params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    return response.data.active === true;
  }
}
