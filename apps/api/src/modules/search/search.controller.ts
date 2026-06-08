import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { SearchQueryDto } from './dto/search-query.dto';
import { ProductResponseDto } from '../products/dto/product-response.dto';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: 'Full-text product search' })
  @ApiOkResponse({ type: ProductResponseDto, isArray: true })
  search(@Query() query: SearchQueryDto) {
    return this.searchService.search(query);
  }
}
