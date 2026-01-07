// Type declarations for @nestjs/schedule
// Workaround for TypeScript module resolution issues with pnpm
declare module '@nestjs/schedule' {
  export function Cron(cronExpression: string): MethodDecorator;
  export class ScheduleModule {
    static forRoot(): any;
  }
  export enum CronExpression {
    EVERY_SECOND = '* * * * * *',
    EVERY_5_SECONDS = '*/5 * * * * *',
    EVERY_MINUTE = '* * * * *',
    EVERY_5_MINUTES = '*/5 * * * *',
    EVERY_HOUR = '0 * * * *',
    EVERY_DAY_AT_1AM = '0 1 * * *',
    EVERY_DAY_AT_2AM = '0 2 * * *',
    EVERY_DAY_AT_MIDNIGHT = '0 0 * * *',
  }
}













