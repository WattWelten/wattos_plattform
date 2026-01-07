// Type declarations for @nestjs/swagger
// Workaround for TypeScript module resolution issues with pnpm
declare module '@nestjs/swagger' {
  export function ApiBearerAuth(name?: string): ClassDecorator & MethodDecorator;
  export function ApiOperation(options: {
    summary?: string;
    description?: string;
  }): MethodDecorator;
  export function ApiResponse(options: {
    status: number;
    description?: string;
    type?: any;
    schema?: any;
  }): MethodDecorator;
  export function ApiTags(...tags: string[]): ClassDecorator;
  export function ApiExcludeController(exclude?: boolean): ClassDecorator;
  export function ApiProperty(options?: any): PropertyDecorator;
  export class SwaggerModule {
    static createDocument(app: any, config: any): any;
    static setup(path: string, app: any, document: any, options?: any): void;
  }

  export class DocumentBuilder {
    setTitle(title: string): DocumentBuilder;
    setDescription(description: string): DocumentBuilder;
    setVersion(version: string): DocumentBuilder;
    addBearerAuth(options?: any, name?: string): DocumentBuilder;
    addTag(name: string, description?: string): DocumentBuilder;
    addServer(url: string, description?: string): DocumentBuilder;
    build(): any;
  }
}
