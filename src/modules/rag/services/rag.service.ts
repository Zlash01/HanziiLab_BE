import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { RagContext } from '../entities/rag-context.entity';
import { VectorSearchService, SearchResult, SearchOptions } from './vector-search.service';
import { SourceType } from '../entities/embedding.entity';

export interface RagQuery {
  query: string;
  userId?: number;
  hskLevel?: number;
  type?: 'general' | 'word' | 'grammar' | 'lesson';
  context?: string | Record<string, any>;  // String or JSON of current question/content
}

export interface RagResponse {
  answer: string;
  sources: SearchResult[];
  confidence: number;
  processingTime: number;
  contextId?: number;
}

export interface LLMRequest {
  prompt: string;
  context: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);
  private readonly llmServiceUrl: string;
  private readonly defaultModel: string;

  // Smart default constants for context-based optimization
  private readonly SIMILARITY_THRESHOLDS = {
    word: 0.7,      // Word definitions need high precision
    grammar: 0.6,   // Grammar patterns can be more flexible
    lesson: 0.5,    // Lesson content can be broader
    general: 0.6,   // Balanced default
  };

  private readonly SOURCE_LIMITS = {
    word: 3,        // Word lookups need fewer sources
    grammar: 7,     // Grammar needs more examples
    lesson: 10,     // Lessons benefit from comprehensive context
    general: 5,     // Balanced default
  };

  constructor(
    @InjectRepository(RagContext)
    private ragContextRepository: Repository<RagContext>,
    private vectorSearchService: VectorSearchService,
    private configService: ConfigService,
  ) {
    this.llmServiceUrl = this.configService.get<string>('LLM_SERVICE_URL', 'http://localhost:8001');
    this.defaultModel = this.configService.get<string>('LLM_MODEL', 'qwen-2.5b-instruct');
  }

  async query(ragQuery: RagQuery): Promise<RagResponse> {
    const startTime = Date.now();
    const { query, userId, hskLevel, type = 'general', context } = ragQuery;

    // Calculate smart defaults based on type and HSK level
    const minSimilarity = this.getSmartMinSimilarity(type, hskLevel);
    const maxSources = this.getSmartMaxSources(type, hskLevel);

    try {
      this.logger.debug(`Processing RAG query: "${query}" for user ${userId || 'anonymous'}`);

      // 1. Search for relevant content
      const searchOptions: SearchOptions = {
        minSimilarity,
        limit: maxSources,
        hskLevel,
        includeMetadata: true,
      };

      // Filter by type
      if (type === 'word') {
        searchOptions.sourceTypes = [SourceType.WORD];
      } else if (type === 'grammar') {
        searchOptions.sourceTypes = [SourceType.GRAMMAR];
      } else if (type === 'lesson') {
        searchOptions.sourceTypes = [SourceType.CONTENT, SourceType.QUESTION];
      }

      const sources = await this.vectorSearchService.searchSimilar(query, searchOptions);

      this.logger.debug(`Found ${sources.length} relevant sources`);

      // 2. Generate response using LLM
      const response = await this.generateResponse(query, sources, hskLevel, context);

      const processingTime = Date.now() - startTime;

      // 3. Store the context for analytics
      const ragContext = await this.ragContextRepository.save({
        userId,
        query,
        response: response.answer,
        retrievedSources: sources.map(s => ({
          sourceType: s.sourceType,
          sourceId: s.sourceId,
          similarity: s.similarity,
          content: s.contentText,
        })),
        processingTimeMs: processingTime,
      });

      return {
        answer: response.answer,
        sources,
        confidence: response.confidence,
        processingTime,
        contextId: ragContext.id,
      };
    } catch (error) {
      this.logger.error(`RAG query failed: ${error.message}`, error.stack);
      throw new Error(`RAG query failed: ${error.message}`);
    }
  }

  private async generateResponse(
    query: string,
    sources: SearchResult[],
    hskLevel?: number,
    userContext?: string | Record<string, any>,
  ): Promise<{ answer: string; confidence: number }> {
    try {
      // Build context from sources
      const contextText = sources
        .map((source, index) => {
          const sourceLabel = this.getSourceLabel(source.sourceType);
          const hskInfo = source.metadata?.hskLevel ? ` (HSK ${source.metadata.hskLevel})` : '';
          return `${index + 1}. [${sourceLabel}${hskInfo}] ${source.contentText}`;
        })
        .join('\n\n');

      // Build full context including user's current content
      let fullContext = contextText;
      if (userContext) {
        const contextStr = typeof userContext === 'string' 
          ? userContext 
          : JSON.stringify(userContext, null, 2);
        fullContext = `Current content the user is viewing:\n${contextStr}\n\n${contextText}`;
      }

      // Build the prompt
      const prompt = this.buildPrompt(query, fullContext, hskLevel);

      // Call LLM service
      const llmResponse = await axios.post(
        `${this.llmServiceUrl}/generate`,
        {
          prompt,
          context: fullContext,
          model: 'gemini-2.5-flash',
          maxTokens: 10000,
          temperature: 0.7,
        } as LLMRequest,
        {
          timeout: 60000,
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const answer = llmResponse.data.text || llmResponse.data.response || 'No response generated';
      const confidence = this.calculateConfidence(sources, llmResponse.data);

      return { answer, confidence };
    } catch (error) {
      this.logger.error(`LLM generation failed: ${error.message}`, error.stack);
      
      // Fallback response in development
      if (process.env.NODE_ENV === 'development') {
        return {
          answer: this.generateFallbackResponse(query, sources, hskLevel),
          confidence: 0.5,
        };
      }
      
      throw new Error(`Response generation failed: ${error.message}`);
    }
  }

  /**
   * Calculate smart minimum similarity threshold based on context type and HSK level
   */
  private getSmartMinSimilarity(context: string, hskLevel?: number): number {
    const baseThreshold = this.SIMILARITY_THRESHOLDS[context] || this.SIMILARITY_THRESHOLDS.general;

    // Adjust for beginner levels - show more examples
    if (hskLevel && hskLevel <= 2) {
      return Math.max(baseThreshold - 0.1, 0.4); // Lower threshold but not below 0.4
    }

    return baseThreshold;
  }

  /**
   * Calculate smart maximum sources based on context type and HSK level
   */
  private getSmartMaxSources(context: string, hskLevel?: number): number {
    const baseLimit = this.SOURCE_LIMITS[context] || this.SOURCE_LIMITS.general;

    // Adjust for beginner levels - provide more examples
    if (hskLevel && hskLevel <= 2) {
      return Math.min(baseLimit + 2, 20); // Add 2 sources but cap at 20
    }

    return baseLimit;
  }

  private buildPrompt(query: string, context: string, hskLevel?: number): string {
    const hskContext = hskLevel ? `The user is studying Chinese at HSK level ${hskLevel}. ` : '';

    return `You are a professional Chinese language learning assistant for Vietnamese speakers. ${hskContext}

IMPORTANT: The user will ask questions in Vietnamese. You MUST respond in Vietnamese.

Context Information:
${context}

User Question (in Vietnamese): ${query}

Instructions:
- Answer the user's question using the provided context
- Respond ENTIRELY in Vietnamese
- Use Chinese characters only as examples with Vietnamese explanations
- Provide accurate, helpful answers about Chinese language learning
- Use simple, clear Vietnamese explanations appropriate for language learners
- Include relevant Chinese examples with Vietnamese translations when helpful
- If the context doesn't contain enough information, acknowledge this clearly in Vietnamese
- Keep responses concise but informative

Answer (in Vietnamese):`;
  }

  private generateFallbackResponse(query: string, sources: SearchResult[], hskLevel?: number): string {
    if (sources.length === 0) {
      return `I couldn't find specific information about "${query}" in the learning materials. This might be a topic not yet covered in the current HSK level content.`;
    }

    const topSource = sources[0];
    const sourceLabel = this.getSourceLabel(topSource.sourceType);
    
    return `Based on the ${sourceLabel} content, here's what I found related to "${query}": ${topSource.contentText.slice(0, 200)}... This information has a similarity score of ${(topSource.similarity * 100).toFixed(1)}% with your question.`;
  }

  private getSourceLabel(sourceType: SourceType): string {
    switch (sourceType) {
      case SourceType.WORD:
        return 'vocabulary';
      case SourceType.GRAMMAR:
        return 'grammar';
      case SourceType.CONTENT:
        return 'lesson content';
      case SourceType.QUESTION:
        return 'exercise';
      default:
        return 'learning material';
    }
  }

  private calculateConfidence(sources: SearchResult[], llmData?: any): number {
    if (sources.length === 0) return 0.1;
    
    // Base confidence on similarity scores and number of sources
    const avgSimilarity = sources.reduce((sum, s) => sum + s.similarity, 0) / sources.length;
    const sourceBonus = Math.min(sources.length / 5, 1) * 0.2; // Up to 20% bonus for more sources
    
    return Math.min(avgSimilarity + sourceBonus, 1.0);
  }

  async getQueryHistory(userId: number, limit: number = 10): Promise<RagContext[]> {
    return this.ragContextRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getAnalytics(): Promise<{
    totalQueries: number;
    avgProcessingTime: number;
    avgSourcesUsed: number;
    popularQueries: Array<{ query: string; count: number }>;
  }> {
    try {
      const totalQueries = await this.ragContextRepository.count();
      
      const avgProcessingResult = await this.ragContextRepository
        .createQueryBuilder('rag')
        .select('AVG(rag.processingTimeMs)', 'avg')
        .getRawOne();

      const avgSourcesResult = await this.ragContextRepository
        .createQueryBuilder('rag')
        .select('AVG(JSON_LENGTH(rag.retrievedSources))', 'avg')
        .getRawOne();

      const popularQueriesResult = await this.ragContextRepository
        .createQueryBuilder('rag')
        .select('rag.query', 'query')
        .addSelect('COUNT(*)', 'count')
        .groupBy('rag.query')
        .orderBy('count', 'DESC')
        .limit(10)
        .getRawMany();

      return {
        totalQueries,
        avgProcessingTime: parseFloat(avgProcessingResult?.avg || '0'),
        avgSourcesUsed: parseFloat(avgSourcesResult?.avg || '0'),
        popularQueries: popularQueriesResult.map(r => ({
          query: r.query,
          count: parseInt(r.count),
        })),
      };
    } catch (error) {
      this.logger.error('Failed to get RAG analytics:', error.stack);
      throw new Error(`Failed to get RAG analytics: ${error.message}`);
    }
  }
}