import { Controller, Post, Body, Get, UseGuards, Request, UsePipes } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { TokenBlacklistGuard } from './guards/token-blacklist.guard';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { RegisterDto } from './dto/register.dto';
import { ZodValidationPipe } from '@wattweiser/shared';
import { LoginDtoSchema } from './dto/login.dto.schema';
import { RegisterDtoSchema } from './dto/register.dto.schema';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @UsePipes(new ZodValidationPipe(LoginDtoSchema))
  @ApiOperation({ summary: 'User login', description: 'Authenticate user and receive JWT token' })
  @ApiResponse({ status: 200, description: 'Login successful', type: LoginResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(loginDto.username, loginDto.password);
    return this.authService.login(user);
  }

  @Post('register')
  @UsePipes(new ZodValidationPipe(RegisterDtoSchema))
  @ApiOperation({ summary: 'User registration', description: 'Register a new user and receive JWT token' })
  @ApiResponse({ status: 201, description: 'Registration successful', type: LoginResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid registration data' })
  @ApiResponse({ status: 401, description: 'Registration failed' })
  async register(@Body() registerDto: RegisterDto) {
    const result = await this.authService.register(
      registerDto.name,
      registerDto.email,
      registerDto.password,
      registerDto.tenantType
    );
    return result;
  }

  @Post('logout')
  @UseGuards(TokenBlacklistGuard, JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'User logout', description: 'Logout and invalidate token' })
  @ApiResponse({
    status: 200,
    description: 'Logout successful',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Logged out successfully' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(@Request() req: any) {
    // Token aus Authorization Header extrahieren
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');

    if (token) {
      await this.authService.logout(token, req.user?.id);
    }

    return { message: 'Logged out successfully' };
  }

  @Get('me')
  @UseGuards(TokenBlacklistGuard, JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Get authenticated user information',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'user-123' },
        email: { type: 'string', example: 'user@example.com' },
        keycloakId: { type: 'string', example: 'keycloak-123' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@Request() req: any) {
    return req.user;
  }
}
