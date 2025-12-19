import { Module } from '@nestjs/common';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { VectorStoreModule } from '../vector-store/vector-store.module';
import { CacheModule } from '@wattweiser/shared';

@Module({
  imports: [VectorStoreModule, CacheModule],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}


