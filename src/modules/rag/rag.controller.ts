import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  ParseIntPipe,
  Request,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { JWTGuard } from '../auth/guard/jwt.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { RagService } from './services/rag.service';
import { VectorSearchService } from './services/vector-search.service';
import { ContentExtractionService } from './services/content-extraction.service';
import { EmbeddingService } from './services/embedding.service';
import { RagQueryDto } from './dto/rag-query.dto';
import { SearchQueryDto, FindSimilarDto } from './dto/search-query.dto';
import { ProcessContentDto } from './dto/content-extraction.dto';

@ApiTags('rag')
@ApiBearerAuth()
@Controller('rag')
@UseGuards(JWTGuard, RolesGuard)
export class RagController {
  constructor(
    private readonly ragService: RagService,
    private readonly vectorSearchService: VectorSearchService,
    private readonly contentExtractionService: ContentExtractionService,
    private readonly embeddingService: EmbeddingService,
  ) {}

  @Post('query')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.User, Role.Admin)
  @ApiOperation({
    summary: 'Ask a question using RAG',
    description: 'Process a user question using Retrieval-Augmented Generation with Chinese language learning content. The system automatically optimizes search parameters based on the context type (word/grammar/lesson) and HSK level. Simply provide your question - the backend handles the rest.'
  })
  @ApiBody({ type: RagQueryDto })
  @ApiResponse({
    status: 200,
    description: 'RAG response with answer and sources',
    schema: {
      type: 'object',
      properties: {
        answer: { type: 'string' },
        sources: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sourceType: { type: 'string' },
              sourceId: { type: 'number' },
              contentText: { type: 'string' },
              similarity: { type: 'number' },
            }
          }
        },
        confidence: { type: 'number' },
        processingTime: { type: 'number' },
        contextId: { type: 'number' }
      }
    }
  })
  async queryRag(@Body() ragQueryDto: RagQueryDto, @Request() req: any) {
    const userId = req.user?.id;
    
    return this.ragService.query({
      ...ragQueryDto,
      userId,
    });
  }

  @Post('search')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.User, Role.Admin)
  @ApiOperation({ 
    summary: 'Search similar content using vector similarity',
    description: 'Find similar learning content based on semantic similarity'
  })
  @ApiBody({ type: SearchQueryDto })
  @ApiResponse({
    status: 200,
    description: 'List of similar content items',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          sourceType: { type: 'string' },
          sourceId: { type: 'number' },
          contentText: { type: 'string' },
          similarity: { type: 'number' },
          metadata: { type: 'object' }
        }
      }
    }
  })
  async searchSimilar(@Body() searchQueryDto: SearchQueryDto) {
    return this.vectorSearchService.searchSimilar(
      searchQueryDto.query,
      {
        sourceTypes: searchQueryDto.sourceTypes,
        minSimilarity: searchQueryDto.minSimilarity,
        limit: searchQueryDto.limit,
        hskLevel: searchQueryDto.hskLevel,
        includeMetadata: searchQueryDto.includeMetadata,
      }
    );
  }

  @Post('search/similar')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.User, Role.Admin)
  @ApiOperation({ 
    summary: 'Find content similar to a specific item',
    description: 'Find learning content similar to a specific word, grammar pattern, or lesson content'
  })
  @ApiBody({ type: FindSimilarDto })
  @ApiResponse({
    status: 200,
    description: 'List of similar content items'
  })
  async findSimilarContent(@Body() findSimilarDto: FindSimilarDto) {
    return this.vectorSearchService.findSimilarContent(
      findSimilarDto.sourceType,
      findSimilarDto.sourceId,
      {
        sourceTypes: findSimilarDto.sourceTypes,
        minSimilarity: findSimilarDto.minSimilarity,
        limit: findSimilarDto.limit,
        hskLevel: findSimilarDto.hskLevel,
        includeMetadata: findSimilarDto.includeMetadata,
      }
    );
  }

  @Get('history')
  @Roles(Role.User, Role.Admin)
  @ApiOperation({ 
    summary: 'Get user query history',
    description: 'Retrieve the user\'s previous RAG queries and responses'
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of queries to return (default: 10)' })
  @ApiResponse({
    status: 200,
    description: 'List of previous queries and responses'
  })
  async getQueryHistory(
    @Request() req: any,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }
    
    return this.ragService.getQueryHistory(userId, limit);
  }

  @Get('analytics')
  @Roles(Role.Admin)
  @ApiOperation({ 
    summary: 'Get RAG analytics (Admin only)',
    description: 'Retrieve analytics about RAG usage, performance, and popular queries'
  })
  @ApiResponse({
    status: 200,
    description: 'RAG system analytics',
    schema: {
      type: 'object',
      properties: {
        totalQueries: { type: 'number' },
        avgProcessingTime: { type: 'number' },
        avgSourcesUsed: { type: 'number' },
        popularQueries: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              query: { type: 'string' },
              count: { type: 'number' }
            }
          }
        }
      }
    }
  })
  async getAnalytics() {
    return this.ragService.getAnalytics();
  }

  @Get('embeddings/stats')
  @Roles(Role.Admin)
  @ApiOperation({ 
    summary: 'Get embedding statistics (Admin only)',
    description: 'Retrieve statistics about stored embeddings'
  })
  @ApiResponse({
    status: 200,
    description: 'Embedding statistics',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number' },
        active: { type: 'number' },
        bySourceType: {
          type: 'object',
          additionalProperties: { type: 'number' }
        }
      }
    }
  })
  async getEmbeddingStats() {
    return this.vectorSearchService.getEmbeddingStats();
  }

  @Post('embeddings/process')
  @HttpCode(HttpStatus.ACCEPTED)
  @Roles(Role.Admin)
  @ApiOperation({ 
    summary: 'Process content for embeddings (Admin only)',
    description: 'Extract and generate embeddings for existing content (words, grammar, lessons, questions)'
  })
  @ApiBody({ type: ProcessContentDto })
  @ApiResponse({
    status: 202,
    description: 'Content processing started',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        status: { type: 'string' }
      }
    }
  })
  async processContent(@Body() processContentDto: ProcessContentDto) {
    // Run content processing in background
    this.contentExtractionService.processAllContent()
      .catch(error => {
        console.error('Content processing failed:', error);
      });

    return {
      message: 'Content processing started',
      status: 'processing'
    };
  }

  @Get('embeddings/health')
  @Roles(Role.User, Role.Admin)
  @ApiOperation({ 
    summary: 'Check embedding service health',
    description: 'Check if the external embedding service is accessible and healthy'
  })
  @ApiResponse({
    status: 200,
    description: 'Embedding service health status',
    schema: {
      type: 'object',
      properties: {
        healthy: { type: 'boolean' },
        service: { type: 'string' }
      }
    }
  })
  async checkEmbeddingHealth() {
    const healthy = await this.embeddingService.healthCheck();
    return {
      healthy,
      service: 'BAAI/bge-m3 Embedding Service'
    };
  }

  @Post('test/embed')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.User, Role.Admin)
  @ApiOperation({ 
    summary: 'Test embedding generation',
    description: 'Test the embedding service with a sample text (for development/testing)'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        text: { type: 'string', example: '你好世界' }
      },
      required: ['text']
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Generated embedding vector',
    schema: {
      type: 'object',
      properties: {
        text: { type: 'string' },
        embedding: {
          type: 'array',
          items: { type: 'number' }
        },
        dimension: { type: 'number' }
      }
    }
  })
  async testEmbedding(@Body() body: { text: string }) {
    if (!body.text) {
      throw new BadRequestException('Text is required');
    }

    const embedding = await this.embeddingService.generateEmbedding(body.text);
    
    return {
      text: body.text,
      embedding,
      dimension: embedding.length
    };
  }
}