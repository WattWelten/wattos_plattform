// Type declarations for class-validator
// Workaround for TypeScript module resolution issues with pnpm
declare module 'class-validator' {
  export function IsString(options?: any): PropertyDecorator;
  export function IsNotEmpty(options?: any): PropertyDecorator;
  export function IsEmail(options?: any): PropertyDecorator;
  export function IsOptional(options?: any): PropertyDecorator;
  export function IsNumber(options?: any): PropertyDecorator;
  export function IsBoolean(options?: any): PropertyDecorator;
  export function IsArray(options?: any): PropertyDecorator;
  export function ValidateNested(options?: any): PropertyDecorator;
  export function IsEnum(options?: any): PropertyDecorator;
  export function MinLength(length: number, options?: any): PropertyDecorator;
  export function MaxLength(length: number, options?: any): PropertyDecorator;
  export function Min(min: number, options?: any): PropertyDecorator;
  export function Max(max: number, options?: any): PropertyDecorator;
}
