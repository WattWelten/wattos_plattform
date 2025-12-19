import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { HttpAdapter } from './http/http.adapter';
import { EmailAdapter } from './email/email.adapter';
import { JiraAdapter } from './jira/jira.adapter';
import { SlackAdapter } from './slack/slack.adapter';
import { RetrievalAdapter } from './retrieval/retrieval.adapter';
import { AdapterFactory } from './adapter.factory';

@Module({
  imports: [HttpModule],
  providers: [
    HttpAdapter,
    EmailAdapter,
    JiraAdapter,
    SlackAdapter,
    RetrievalAdapter,
    AdapterFactory,
  ],
  exports: [AdapterFactory],
})
export class AdaptersModule {}


