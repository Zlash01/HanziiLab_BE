import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosResponse } from 'axios';

export interface EmbeddingResponse {
  embedding: number[];
  model: string;
  usage?: {
    totalTokens: number;
  };
}

export interface EmbeddingRequest {
  text: string;
  model?: string;
}

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private readonly embeddingUrl: string;
  private readonly model: string;

  constructor(private configService: ConfigService) {
    this.embeddingUrl = this.configService.get<string>('EMBEDDING_SERVICE_URL', 'http://localhost:8000');
    this.model = this.configService.get<string>('EMBEDDING_MODEL', 'BAAI/bge-m3');
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const startTime = Date.now();
      
      const response: AxiosResponse<EmbeddingResponse> = await axios.post(
        `${this.embeddingUrl}/embed`,
        {
          text: text.trim(),
          model: this.model,
        } as EmbeddingRequest,
        {
          timeout: 30000, // 30 second timeout
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const duration = Date.now() - startTime;
      this.logger.debug(`Generated embedding for text length ${text.length} in ${duration}ms`);
      
      return response.data.embedding;
    } catch (error) {
      this.logger.error(`Failed to generate embedding: ${error.message}`, error.stack);
      
      // For development, return a mock embedding of correct dimensions (1024 for bge-m3)
      if (process.env.NODE_ENV === 'development') {
        this.logger.warn('Using mock embedding for development');
        return this.generateMockEmbedding();
      }
      
      throw new Error(`Embedding generation failed: ${error.message}`);
    }
  }

  async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      const startTime = Date.now();
      
      const response: AxiosResponse<{ embeddings: number[][] }> = await axios.post(
        `${this.embeddingUrl}/embed/batch`,
        {
          texts: texts.map(t => t.trim()),
          model: this.model,
        },
        {
          timeout: 60000, // 1 minute timeout for batch
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const duration = Date.now() - startTime;
      this.logger.debug(`Generated ${texts.length} embeddings in ${duration}ms`);
      
      return response.data.embeddings;
    } catch (error) {
      this.logger.error(`Failed to generate batch embeddings: ${error.message}`, error.stack);
      
      // For development, return mock embeddings
      if (process.env.NODE_ENV === 'development') {
        this.logger.warn(`Using ${texts.length} mock embeddings for development`);
        return texts.map(() => this.generateMockEmbedding());
      }
      
      throw new Error(`Batch embedding generation failed: ${error.message}`);
    }
  }

  private generateMockEmbedding(): number[] {
    // Generate a realistic-looking random embedding (1024 dimensions for bge-m3)
    const embedding = Array.from({ length: 1024 }, () => 
      (Math.random() - 0.5) * 2 // Random values between -1 and 1
    );
    
    // Normalize the vector to unit length (like real embeddings)
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / magnitude);
  }

  calculateCosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }

    const magnitude = Math.sqrt(norm1) * Math.sqrt(norm2);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.embeddingUrl}/health`, {
        timeout: 5000,
      });
      return response.status === 200;
    } catch (error) {
      this.logger.warn(`Embedding service health check failed: ${error.message}`);
      return false;
    }
  }
}