import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Embedding, SourceType } from '../entities/embedding.entity';
import { EmbeddingService } from './embedding.service';

export interface SearchResult {
  id: number;
  sourceType: SourceType;
  sourceId: number;
  contentText: string;
  similarity: number;
  metadata?: Record<string, any>;
}

export interface SearchOptions {
  sourceTypes?: SourceType[];
  minSimilarity?: number;
  limit?: number;
  hskLevel?: number;
  includeMetadata?: boolean;
}

@Injectable()
export class VectorSearchService {
  private readonly logger = new Logger(VectorSearchService.name);

  constructor(
    @InjectRepository(Embedding)
    private embeddingRepository: Repository<Embedding>,
    private embeddingService: EmbeddingService,
  ) {}

  async searchSimilar(
    query: string,
    options: SearchOptions = {},
  ): Promise<SearchResult[]> {
    const {
      sourceTypes = [SourceType.WORD, SourceType.GRAMMAR, SourceType.CONTENT, SourceType.QUESTION],
      minSimilarity = 0.5,
      limit = 10,
      hskLevel,
      includeMetadata = true,
    } = options;

    try {
      // Generate embedding for the query
      const queryEmbedding = await this.embeddingService.generateEmbedding(query);

      // Get all active embeddings that match our criteria
      const queryBuilder = this.embeddingRepository
        .createQueryBuilder('embedding')
        .where('embedding.isActive = :isActive', { isActive: true })
        .andWhere('embedding.sourceType IN (:...sourceTypes)', { sourceTypes });

      // Add HSK level filter if specified
      if (hskLevel) {
        queryBuilder.andWhere(
          'JSON_EXTRACT(embedding.metadata, "$.hskLevel") = :hskLevel',
          { hskLevel }
        );
      }

      const embeddings = await queryBuilder.getMany();

      this.logger.debug(`Found ${embeddings.length} embeddings to compare against query: "${query}"`);

      // Calculate similarities and sort
      const results: SearchResult[] = embeddings
        .map(embedding => {
          const similarity = this.embeddingService.calculateCosineSimilarity(
            queryEmbedding,
            embedding.embedding
          );

          return {
            id: embedding.id,
            sourceType: embedding.sourceType,
            sourceId: embedding.sourceId,
            contentText: embedding.contentText,
            similarity,
            ...(includeMetadata && { metadata: embedding.metadata }),
          };
        })
        .filter(result => result.similarity >= minSimilarity)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);

      this.logger.debug(`Returning ${results.length} results with similarity >= ${minSimilarity}`);

      return results;
    } catch (error) {
      this.logger.error(`Vector search failed for query "${query}":`, error.stack);
      throw new Error(`Vector search failed: ${error.message}`);
    }
  }

  async searchBySourceType(
    query: string,
    sourceType: SourceType,
    options: Omit<SearchOptions, 'sourceTypes'> = {},
  ): Promise<SearchResult[]> {
    return this.searchSimilar(query, { ...options, sourceTypes: [sourceType] });
  }

  async findSimilarContent(
    sourceType: SourceType,
    sourceId: number,
    options: SearchOptions = {},
  ): Promise<SearchResult[]> {
    try {
      // Get the embedding for the source content
      const sourceEmbedding = await this.embeddingRepository.findOne({
        where: { sourceType, sourceId, isActive: true },
      });

      if (!sourceEmbedding) {
        this.logger.warn(`No embedding found for ${sourceType}:${sourceId}`);
        return [];
      }

      // Find similar embeddings (excluding the source itself)
      const queryBuilder = this.embeddingRepository
        .createQueryBuilder('embedding')
        .where('embedding.isActive = :isActive', { isActive: true })
        .andWhere('NOT (embedding.sourceType = :sourceType AND embedding.sourceId = :sourceId)', {
          sourceType,
          sourceId,
        });

      if (options.sourceTypes) {
        queryBuilder.andWhere('embedding.sourceType IN (:...sourceTypes)', {
          sourceTypes: options.sourceTypes,
        });
      }

      if (options.hskLevel) {
        queryBuilder.andWhere(
          'JSON_EXTRACT(embedding.metadata, "$.hskLevel") = :hskLevel',
          { hskLevel: options.hskLevel }
        );
      }

      const embeddings = await queryBuilder.getMany();

      // Calculate similarities and sort
      const results: SearchResult[] = embeddings
        .map(embedding => {
          const similarity = this.embeddingService.calculateCosineSimilarity(
            sourceEmbedding.embedding,
            embedding.embedding
          );

          return {
            id: embedding.id,
            sourceType: embedding.sourceType,
            sourceId: embedding.sourceId,
            contentText: embedding.contentText,
            similarity,
            ...(options.includeMetadata && { metadata: embedding.metadata }),
          };
        })
        .filter(result => result.similarity >= (options.minSimilarity || 0.5))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, options.limit || 10);

      return results;
    } catch (error) {
      this.logger.error(`Find similar content failed for ${sourceType}:${sourceId}:`, error.stack);
      throw new Error(`Find similar content failed: ${error.message}`);
    }
  }

  async getEmbeddingStats(): Promise<{
    total: number;
    bySourceType: Record<string, number>;
    active: number;
  }> {
    try {
      const [total, active] = await Promise.all([
        this.embeddingRepository.count(),
        this.embeddingRepository.count({ where: { isActive: true } }),
      ]);

      const bySourceTypeResults = await this.embeddingRepository
        .createQueryBuilder('embedding')
        .select('embedding.sourceType', 'sourceType')
        .addSelect('COUNT(*)', 'count')
        .where('embedding.isActive = :isActive', { isActive: true })
        .groupBy('embedding.sourceType')
        .getRawMany();

      const bySourceType = bySourceTypeResults.reduce((acc, row) => {
        acc[row.sourceType] = parseInt(row.count);
        return acc;
      }, {});

      return { total, bySourceType, active };
    } catch (error) {
      this.logger.error('Failed to get embedding stats:', error.stack);
      throw new Error(`Failed to get embedding stats: ${error.message}`);
    }
  }
}