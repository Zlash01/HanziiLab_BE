# RAG Implementation Guide for Chinese Learning Backend

## Overview

This guide provides step-by-step instructions for implementing Retrieval Augmented Generation (RAG) with the Chinese language learning database. The implementation follows a staged approach: starting with local development using Qwen 2.5 3B Instruct model, then migrating to cloud production with GPT-OSS-20B.

## Table of Contents

1. [Phase 1: Local Development Setup](#phase-1-local-development-setup)
2. [Phase 2: Embedding and Vector Storage](#phase-2-embedding-and-vector-storage)
3. [Phase 3: RAG with Qwen 2.5 3B](#phase-3-rag-with-qwen-25-3b)
4. [Phase 4: Testing and Validation](#phase-4-testing-and-validation)
5. [Phase 5: Production Migration](#phase-5-production-migration)
6. [Implementation Timeline](#implementation-timeline)

---

## Phase 1: Local Development Setup

### Step 1: Set up Basic RAG Infrastructure

#### 1.1 Create NestJS RAG Module

```bash
# Generate module structure
nest generate module rag
nest generate service rag/services/rag-query
nest generate service rag/services/data-extractor
nest generate service rag/services/chunker
nest generate service rag/services/embedding
nest generate service rag/services/vector-store
nest generate controller rag
```

#### 1.2 Install Required Dependencies

```bash
# Core RAG dependencies
npm install @huggingface/transformers
npm install chromadb
npm install ollama

# Optional: Alternative vector databases
npm install faiss-node  # Alternative to ChromaDB
npm install @pinecone-database/pinecone  # For cloud vector storage
```

#### 1.3 Environment Configuration

Add to `.env`:

```env
# RAG Configuration
RAG_MODEL_TYPE=local  # local | cloud
RAG_EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
RAG_VECTOR_DB_URL=http://localhost:8000
RAG_LLM_API_URL=http://localhost:11434
RAG_LLM_MODEL=qwen2.5:3b-instruct

# Production settings (for later)
RAG_CLOUD_API_KEY=your_api_key_here
RAG_CLOUD_MODEL=gpt-oss-20b
```

**Deliverable**: Working NestJS RAG module skeleton

---

### Step 2: Create Data Extraction Pipeline

#### 2.1 Data Extractor Service

Create `src/modules/rag/services/data-extractor.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Word } from '../../words/entities/word.entity';
import { GrammarPattern } from '../../grammar/entities/grammar-pattern.entity';
import { Content } from '../../lessons/entities/content.entity';
import { Question } from '../../lessons/entities/question.entity';

export interface WordChunk {
  id: string;
  type: 'word_definition';
  chinese: string;
  traditional: string;
  pinyin: string;
  partOfSpeech: string;
  hskLevel: number;
  meaning: string;
  example: string;
  text: string; // Full text for embedding
  sourceId: number;
}

export interface GrammarChunk {
  id: string;
  type: 'grammar_pattern';
  pattern: string;
  pinyin: string;
  formula: string;
  hskLevel: number;
  explanation: string;
  examples: string[];
  text: string;
  sourceId: number;
}

export interface ContentChunk {
  id: string;
  type: 'lesson_content';
  lessonTitle: string;
  contentType: string;
  hskLevel: number;
  data: any;
  text: string;
  sourceId: number;
}

export interface QuestionChunk {
  id: string;
  type: 'lesson_question';
  questionType: string;
  difficulty: number;
  hskLevel: number;
  context: string;
  questionText: string;
  correctAnswer: string;
  explanation: string;
  text: string;
  sourceId: number;
}

@Injectable()
export class DataExtractorService {
  constructor(
    @InjectRepository(Word)
    private wordsRepository: Repository<Word>,
    @InjectRepository(GrammarPattern)
    private grammarRepository: Repository<GrammarPattern>,
    @InjectRepository(Content)
    private contentRepository: Repository<Content>,
    @InjectRepository(Question)
    private questionRepository: Repository<Question>,
  ) {}

  async extractWords(limit = 100): Promise<WordChunk[]> {
    const words = await this.wordsRepository
      .createQueryBuilder('w')
      .leftJoinAndSelect('w.senses', 'ws')
      .leftJoinAndSelect('ws.translations', 'wst')
      .limit(limit)
      .getMany();

    const chunks: WordChunk[] = [];

    for (const word of words) {
      for (const sense of word.senses) {
        const englishTranslation = sense.translations.find(
          (t) => t.language === 'en',
        );
        if (englishTranslation) {
          chunks.push({
            id: `word_${word.id}_${sense.id}`,
            type: 'word_definition',
            chinese: word.simplified,
            traditional: word.traditional || word.simplified,
            pinyin: sense.pinyin,
            partOfSpeech: sense.partOfSpeech,
            hskLevel: sense.hskLevel || 1,
            meaning: englishTranslation.translation,
            example: sense.exampleContext || '',
            text: this.buildWordText(
              word,
              sense,
              englishTranslation.translation,
            ),
            sourceId: word.id,
          });
        }
      }
    }

    return chunks;
  }

  async extractGrammar(limit = 50): Promise<GrammarChunk[]> {
    const patterns = await this.grammarRepository
      .createQueryBuilder('gp')
      .leftJoinAndSelect('gp.translations', 'gt')
      .limit(limit)
      .getMany();

    const chunks: GrammarChunk[] = [];

    for (const pattern of patterns) {
      const englishTranslation = pattern.translations.find(
        (t) => t.language === 'en',
      );
      if (englishTranslation) {
        chunks.push({
          id: `grammar_${pattern.id}`,
          type: 'grammar_pattern',
          pattern: pattern.pattern,
          pinyin: pattern.patternPinyin || '',
          formula: pattern.patternFormula || '',
          hskLevel: pattern.hskLevel || 1,
          explanation: englishTranslation.explanation,
          examples: englishTranslation.examples
            ? JSON.parse(englishTranslation.examples)
            : [],
          text: this.buildGrammarText(pattern, englishTranslation),
          sourceId: pattern.id,
        });
      }
    }

    return chunks;
  }

  async extractLessonContent(limit = 20): Promise<ContentChunk[]> {
    const contents = await this.contentRepository
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.lesson', 'l')
      .limit(limit)
      .getMany();

    const chunks: ContentChunk[] = [];

    for (const content of contents) {
      chunks.push({
        id: `content_${content.id}`,
        type: 'lesson_content',
        lessonTitle: content.lesson?.title || 'Unknown Lesson',
        contentType: content.type,
        hskLevel: content.lesson?.hskLevel || 1,
        data: content.data,
        text: this.buildContentText(content),
        sourceId: content.id,
      });
    }

    return chunks;
  }

  async extractQuestions(limit = 30): Promise<QuestionChunk[]> {
    const questions = await this.questionRepository
      .createQueryBuilder('q')
      .leftJoinAndSelect('q.lesson', 'l')
      .limit(limit)
      .getMany();

    const chunks: QuestionChunk[] = [];

    for (const question of questions) {
      chunks.push({
        id: `question_${question.id}`,
        type: 'lesson_question',
        questionType: question.questionType,
        difficulty: question.data.difficulty || 1,
        hskLevel: question.lesson?.hskLevel || 1,
        context: `${question.lesson?.title || 'Unknown Lesson'}`,
        questionText: question.data.question || '',
        correctAnswer: question.data.correctAnswer || '',
        explanation: question.data.explanation || '',
        text: this.buildQuestionText(question),
        sourceId: question.id,
      });
    }

    return chunks;
  }

  private buildWordText(word: Word, sense: any, translation: string): string {
    return `Chinese word: ${word.simplified} ${word.traditional !== word.simplified ? `(Traditional: ${word.traditional})` : ''} 
Pinyin: ${sense.pinyin}
Meaning: ${translation}
Part of speech: ${sense.partOfSpeech}
HSK Level: ${sense.hskLevel}
Example: ${sense.exampleContext || 'No example available'}`;
  }

  private buildGrammarText(pattern: GrammarPattern, translation: any): string {
    return `Grammar pattern: ${pattern.pattern}
Pinyin: ${pattern.patternPinyin || ''}
Formula: ${pattern.patternFormula || ''}
HSK Level: ${pattern.hskLevel}
Explanation: ${translation.explanation}
Examples: ${translation.examples ? JSON.parse(translation.examples).join(', ') : 'No examples'}`;
  }

  private buildContentText(content: Content): string {
    let text = `Lesson content: ${content.lesson?.title || 'Unknown Lesson'}
Content type: ${content.type}
HSK Level: ${content.lesson?.hskLevel || 1}`;

    if (content.data) {
      if (content.data.words) {
        text += `\nWords: ${JSON.stringify(content.data.words)}`;
      }
      if (content.data.sentences) {
        text += `\nSentences: ${JSON.stringify(content.data.sentences)}`;
      }
    }

    return text;
  }

  private buildQuestionText(question: Question): string {
    return `Question type: ${question.questionType}
Context: ${question.lesson?.title || 'Unknown Lesson'}
Difficulty: ${question.data.difficulty || 1}
HSK Level: ${question.lesson?.hskLevel || 1}
Question: ${question.data.question || ''}
Answer: ${question.data.correctAnswer || ''}
Explanation: ${question.data.explanation || ''}`;
  }
}
```

**Deliverable**: Service that extracts structured data from MySQL tables

---

### Step 3: Implement Chunking Strategy

#### 3.1 Chunker Service

Create `src/modules/rag/services/chunker.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import {
  WordChunk,
  GrammarChunk,
  ContentChunk,
  QuestionChunk,
} from './data-extractor.service';

export type ContentChunkType =
  | WordChunk
  | GrammarChunk
  | ContentChunk
  | QuestionChunk;

@Injectable()
export class ChunkerService {
  chunkWord(word: any, sense: any, translation: string): WordChunk {
    return {
      id: `word_${word.id}_${sense.id}`,
      type: 'word_definition',
      chinese: word.simplified,
      traditional: word.traditional || word.simplified,
      pinyin: sense.pinyin,
      partOfSpeech: sense.partOfSpeech,
      hskLevel: sense.hskLevel || 1,
      meaning: translation,
      example: sense.exampleContext || '',
      text: this.buildWordText(word, sense, translation),
      sourceId: word.id,
    };
  }

  chunkGrammar(pattern: any, translation: any): GrammarChunk {
    return {
      id: `grammar_${pattern.id}`,
      type: 'grammar_pattern',
      pattern: pattern.pattern,
      pinyin: pattern.patternPinyin || '',
      formula: pattern.patternFormula || '',
      hskLevel: pattern.hskLevel || 1,
      explanation: translation.explanation,
      examples: translation.examples ? JSON.parse(translation.examples) : [],
      text: this.buildGrammarText(pattern, translation),
      sourceId: pattern.id,
    };
  }

  chunkContent(content: any): ContentChunk {
    return {
      id: `content_${content.id}`,
      type: 'lesson_content',
      lessonTitle: content.lesson?.title || 'Unknown Lesson',
      contentType: content.type,
      hskLevel: content.lesson?.hskLevel || 1,
      data: content.data,
      text: this.buildContentText(content),
      sourceId: content.id,
    };
  }

  chunkQuestion(question: any): QuestionChunk {
    return {
      id: `question_${question.id}`,
      type: 'lesson_question',
      questionType: question.questionType,
      difficulty: question.data.difficulty || 1,
      hskLevel: question.lesson?.hskLevel || 1,
      context: `${question.lesson?.title || 'Unknown Lesson'}`,
      questionText: question.data.question || '',
      correctAnswer: question.data.correctAnswer || '',
      explanation: question.data.explanation || '',
      text: this.buildQuestionText(question),
      sourceId: question.id,
    };
  }

  private buildWordText(word: any, sense: any, translation: string): string {
    return `Chinese word: ${word.simplified} ${word.traditional !== word.simplified ? `(Traditional: ${word.traditional})` : ''} 
Pinyin: ${sense.pinyin}
Meaning: ${translation}
Part of speech: ${sense.partOfSpeech}
HSK Level: ${sense.hskLevel}
Example: ${sense.exampleContext || 'No example available'}`;
  }

  private buildGrammarText(pattern: any, translation: any): string {
    return `Grammar pattern: ${pattern.pattern}
Pinyin: ${pattern.patternPinyin || ''}
Formula: ${pattern.patternFormula || ''}
HSK Level: ${pattern.hskLevel}
Explanation: ${translation.explanation}
Examples: ${translation.examples ? JSON.parse(translation.examples).join(', ') : 'No examples'}`;
  }

  private buildContentText(content: any): string {
    let text = `Lesson content: ${content.lesson?.title || 'Unknown Lesson'}
Content type: ${content.type}
HSK Level: ${content.lesson?.hskLevel || 1}`;

    if (content.data) {
      if (content.data.words) {
        text += `\nWords: ${JSON.stringify(content.data.words)}`;
      }
      if (content.data.sentences) {
        text += `\nSentences: ${JSON.stringify(content.data.sentences)}`;
      }
    }

    return text;
  }

  private buildQuestionText(question: any): string {
    return `Question type: ${question.questionType}
Context: ${question.lesson?.title || 'Unknown Lesson'}
Difficulty: ${question.data.difficulty || 1}
HSK Level: ${question.lesson?.hskLevel || 1}
Question: ${question.data.question || ''}
Answer: ${question.data.correctAnswer || ''}
Explanation: ${question.data.explanation || ''}`;
  }

  // Utility method to split large text into smaller chunks
  splitTextIntoChunks(text: string, maxLength = 512, overlap = 50): string[] {
    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      let end = start + maxLength;

      if (end >= text.length) {
        chunks.push(text.slice(start));
        break;
      }

      // Try to find a good break point (sentence end, period, etc.)
      let breakPoint = text.lastIndexOf('.', end);
      if (breakPoint === -1 || breakPoint <= start) {
        breakPoint = text.lastIndexOf(' ', end);
      }

      if (breakPoint === -1 || breakPoint <= start) {
        breakPoint = end;
      }

      chunks.push(text.slice(start, breakPoint));
      start = breakPoint - overlap;
      if (start < 0) start = 0;
    }

    return chunks;
  }
}
```

**Deliverable**: Chunking service that converts DB records to embeddable text chunks

---

## Phase 2: Embedding and Vector Storage

### Step 4: Set up Local Embedding Model

#### 4.1 Embedding Service

Create `src/modules/rag/services/embedding.service.ts`:

```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmbeddingService implements OnModuleInit {
  private model: any;
  private isInitialized = false;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    await this.initializeModel();
  }

  async initializeModel() {
    try {
      // Use sentence-transformers via Hugging Face
      const { pipeline } = await import('@huggingface/transformers');

      const modelName = this.configService.get(
        'RAG_EMBEDDING_MODEL',
        'Xenova/all-MiniLM-L6-v2',
      );

      this.model = await pipeline('feature-extraction', modelName, {
        quantized: true, // Use quantized model for faster inference
      });

      this.isInitialized = true;
      console.log(`✅ Embedding model ${modelName} initialized successfully`);
    } catch (error) {
      console.error('❌ Failed to initialize embedding model:', error);
      throw error;
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.isInitialized) {
      await this.initializeModel();
    }

    try {
      const output = await this.model(text, {
        pooling: 'mean',
        normalize: true,
      });
      return Array.from(output.data);
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw error;
    }
  }

  async batchEmbed(texts: string[], batchSize = 10): Promise<number[][]> {
    if (!this.isInitialized) {
      await this.initializeModel();
    }

    const results: number[][] = [];

    // Process in batches to avoid memory issues
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);

      console.log(
        `Processing embedding batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(texts.length / batchSize)}`,
      );

      const batchResults = await Promise.all(
        batch.map((text) => this.generateEmbedding(text)),
      );

      results.push(...batchResults);

      // Small delay to prevent overwhelming the system
      if (i + batchSize < texts.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    return results;
  }

  // Calculate cosine similarity between two embeddings
  cosineSimilarity(vecA: number[], vecB: number[]): number {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));

    if (magnitudeA === 0 || magnitudeB === 0) return 0;
    return dotProduct / (magnitudeA * magnitudeB);
  }
}
```

#### 4.2 Install and Start ChromaDB

```bash
# Install ChromaDB locally
pip install chromadb

# Or run via Docker
docker run -p 8000:8000 chromadb/chroma

# Test ChromaDB is running
curl http://localhost:8000/api/v1/heartbeat
```

**Deliverable**: Local embedding generation service

---

### Step 5: Vector Storage with ChromaDB

#### 5.1 Vector Store Service

Create `src/modules/rag/services/vector-store.service.ts`:

```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChromaApi, Collection } from 'chromadb';
import { ContentChunkType } from './data-extractor.service';

export interface SearchOptions {
  limit?: number;
  maxHskLevel?: number;
  contentTypes?: string[];
  minSimilarity?: number;
}

export interface SearchResult {
  id: string;
  score: number;
  content: string;
  metadata: any;
}

@Injectable()
export class VectorStoreService implements OnModuleInit {
  private client: ChromaApi;
  private collection: Collection;
  private isInitialized = false;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    await this.initialize();
  }

  async initialize() {
    try {
      const chromaUrl = this.configService.get(
        'RAG_VECTOR_DB_URL',
        'http://localhost:8000',
      );

      this.client = new ChromaApi({
        path: chromaUrl,
      });

      // Create or get collection
      try {
        this.collection = await this.client.createCollection({
          name: 'chinese_learning_content',
          metadata: { 'hnsw:space': 'cosine' },
        });
      } catch (error) {
        // Collection might already exist
        this.collection = await this.client.getCollection({
          name: 'chinese_learning_content',
        });
      }

      this.isInitialized = true;
      console.log('✅ ChromaDB vector store initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize ChromaDB:', error);
      throw error;
    }
  }

  async addChunks(chunks: ContentChunkType[], embeddings: number[][]) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const ids = chunks.map((c) => c.id);
      const documents = chunks.map((c) => c.text);
      const metadatas = chunks.map((c) => ({
        type: c.type,
        hskLevel: c.hskLevel,
        sourceId: c.sourceId,
        ...(c.type === 'word_definition' && {
          chinese: (c as any).chinese,
          pinyin: (c as any).pinyin,
          partOfSpeech: (c as any).partOfSpeech,
        }),
        ...(c.type === 'grammar_pattern' && {
          pattern: (c as any).pattern,
          formula: (c as any).formula,
        }),
        ...(c.type === 'lesson_question' && {
          questionType: (c as any).questionType,
          difficulty: (c as any).difficulty,
        }),
      }));

      await this.collection.add({
        ids,
        embeddings,
        documents,
        metadatas,
      });

      console.log(`✅ Added ${chunks.length} chunks to vector store`);
      return { success: true, count: chunks.length };
    } catch (error) {
      console.error('❌ Error adding chunks to vector store:', error);
      throw error;
    }
  }

  async search(
    query: string,
    queryEmbedding: number[],
    options: SearchOptions = {},
  ): Promise<SearchResult[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const {
        limit = 5,
        maxHskLevel = 6,
        contentTypes,
        minSimilarity = 0.3,
      } = options;

      // Build where clause for filtering
      const whereClause: any = {
        hskLevel: { $lte: maxHskLevel },
      };

      if (contentTypes && contentTypes.length > 0) {
        whereClause.type = { $in: contentTypes };
      }

      const results = await this.collection.query({
        queryEmbeddings: [queryEmbedding],
        nResults: limit * 2, // Get more results to filter by similarity
        where: whereClause,
        include: ['documents', 'metadatas', 'distances'],
      });

      // Process and filter results
      const searchResults: SearchResult[] = [];

      if (
        results.distances &&
        results.distances[0] &&
        results.documents &&
        results.documents[0]
      ) {
        for (let i = 0; i < results.distances[0].length; i++) {
          const similarity = 1 - results.distances[0][i]; // Convert distance to similarity

          if (similarity >= minSimilarity) {
            searchResults.push({
              id: results.ids[0][i],
              score: similarity,
              content: results.documents[0][i],
              metadata: results.metadatas ? results.metadatas[0][i] : {},
            });
          }
        }
      }

      // Sort by similarity score (highest first) and limit results
      return searchResults.sort((a, b) => b.score - a.score).slice(0, limit);
    } catch (error) {
      console.error('❌ Error searching vector store:', error);
      throw error;
    }
  }

  async getCollectionInfo() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const count = await this.collection.count();
      return {
        name: 'chinese_learning_content',
        count,
        isReady: true,
      };
    } catch (error) {
      console.error('Error getting collection info:', error);
      return {
        name: 'chinese_learning_content',
        count: 0,
        isReady: false,
        error: error.message,
      };
    }
  }

  async clearCollection() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      await this.client.deleteCollection({ name: 'chinese_learning_content' });

      this.collection = await this.client.createCollection({
        name: 'chinese_learning_content',
        metadata: { 'hnsw:space': 'cosine' },
      });

      console.log('✅ Vector store collection cleared and recreated');
      return { success: true };
    } catch (error) {
      console.error('❌ Error clearing collection:', error);
      throw error;
    }
  }
}
```

**Deliverable**: Working vector storage and similarity search

---

## Phase 3: RAG with Qwen 2.5 3B

### Step 6: Set up Qwen 2.5 3B Locally

#### 6.1 Install and Configure Ollama

```bash
# Install Ollama (Linux/macOS)
curl -fsSL https://ollama.ai/install.sh | sh

# Windows: Download from https://ollama.ai/download

# Start Ollama service
ollama serve

# Pull Qwen 2.5 3B model
ollama pull qwen2.5:3b-instruct

# Test the model
ollama run qwen2.5:3b-instruct "Hello, can you help with Chinese learning?"

# Verify model is available
ollama list
```

#### 6.2 LLM Service

Create `src/modules/rag/services/llm.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface LLMResponse {
  response: string;
  model: string;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_duration?: number;
  eval_duration?: number;
}

@Injectable()
export class LLMService {
  private readonly apiUrl: string;
  private readonly model: string;

  constructor(private configService: ConfigService) {
    this.apiUrl = this.configService.get(
      'RAG_LLM_API_URL',
      'http://localhost:11434',
    );
    this.model = this.configService.get('RAG_LLM_MODEL', 'qwen2.5:3b-instruct');
  }

  async generateResponse(
    prompt: string,
    options: {
      temperature?: number;
      max_tokens?: number;
      stream?: boolean;
    } = {},
  ): Promise<string> {
    try {
      const { temperature = 0.7, max_tokens = 1000, stream = false } = options;

      const response = await fetch(`${this.apiUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          prompt: prompt,
          stream,
          options: {
            temperature,
            num_predict: max_tokens,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: LLMResponse = await response.json();
      return data.response;
    } catch (error) {
      console.error('❌ Error calling LLM:', error);
      throw new Error(`Failed to generate response: ${error.message}`);
    }
  }

  async isModelAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/api/tags`);
      if (!response.ok) return false;

      const data = await response.json();
      return data.models?.some((m: any) => m.name === this.model) || false;
    } catch {
      return false;
    }
  }

  getModelInfo() {
    return {
      model: this.model,
      apiUrl: this.apiUrl,
      provider: 'ollama',
    };
  }
}
```

**Deliverable**: Local Qwen 2.5 3B model integration

---

### Step 7: Create RAG Query Service

#### 7.1 Query Classification

Create `src/modules/rag/services/query-classifier.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';

export interface QueryClassification {
  isChineseLearning: boolean;
  queryType:
    | 'word_lookup'
    | 'grammar_question'
    | 'lesson_help'
    | 'practice_question'
    | 'general_chinese'
    | 'non_chinese';
  confidence: number;
  relevantTypes: string[];
  detectedHskLevel?: number;
  detectedLanguage: 'en' | 'zh' | 'mixed';
}

@Injectable()
export class QueryClassifierService {
  private readonly chineseLearningPatterns = [
    /chinese|mandarin|pinyin|hsk|hanzi|中文|汉字/i,
    /[\u4e00-\u9fff]/, // Chinese characters
    /grammar|pronunciation|tone|stroke/i,
    /learn.*chinese|study.*chinese|chinese.*lesson/i,
    /what.*mean|how.*say|how.*pronounce/i,
  ];

  private readonly nonDbPatterns = [
    /culture|history|why.*chinese/i,
    /difference.*between.*chinese/i,
    /how.*to.*learn|strategy|method/i,
    /regional|dialect|accent|taiwan|beijing/i,
    /traditional.*simplified|simplified.*traditional/i,
  ];

  private readonly wordLookupPatterns = [
    /what.*mean|meaning.*of|define|definition/i,
    /how.*pronounce|pronunciation.*of|pinyin.*for/i,
    /[\u4e00-\u9fff].*mean|mean.*[\u4e00-\u9fff]/i,
  ];

  private readonly grammarPatterns = [
    /grammar|sentence.*structure|word.*order/i,
    /how.*use|usage.*of|when.*use/i,
    /pattern|formula|rule/i,
    /要|是|了|的|在|有.*grammar/i,
  ];

  classifyQuery(query: string): QueryClassification {
    const queryLower = query.toLowerCase();

    // Check if it's Chinese learning related
    const isChineseLearning = this.chineseLearningPatterns.some((pattern) =>
      pattern.test(query),
    );

    if (!isChineseLearning) {
      return {
        isChineseLearning: false,
        queryType: 'non_chinese',
        confidence: 0.9,
        relevantTypes: [],
        detectedLanguage: 'en',
      };
    }

    // Detect language
    const hasChineseChars = /[\u4e00-\u9fff]/.test(query);
    const hasEnglish = /[a-zA-Z]/.test(query);
    const detectedLanguage =
      hasChineseChars && hasEnglish ? 'mixed' : hasChineseChars ? 'zh' : 'en';

    // Classify query type
    let queryType: QueryClassification['queryType'] = 'general_chinese';
    let relevantTypes: string[] = [
      'word_definition',
      'grammar_pattern',
      'lesson_content',
    ];
    let confidence = 0.7;

    if (this.wordLookupPatterns.some((p) => p.test(queryLower))) {
      queryType = 'word_lookup';
      relevantTypes = ['word_definition'];
      confidence = 0.85;
    } else if (this.grammarPatterns.some((p) => p.test(queryLower))) {
      queryType = 'grammar_question';
      relevantTypes = ['grammar_pattern', 'lesson_content'];
      confidence = 0.85;
    } else if (
      queryLower.includes('lesson') ||
      queryLower.includes('practice')
    ) {
      queryType = 'lesson_help';
      relevantTypes = ['lesson_content', 'lesson_question'];
      confidence = 0.8;
    }

    // Detect HSK level mentions
    const hskMatch = query.match(/hsk\s*(\d)/i);
    const detectedHskLevel = hskMatch ? parseInt(hskMatch[1]) : undefined;

    // Check if needs general knowledge
    const needsGeneralKnowledge = this.nonDbPatterns.some((pattern) =>
      pattern.test(query),
    );

    return {
      isChineseLearning: true,
      queryType,
      confidence,
      relevantTypes,
      detectedHskLevel,
      detectedLanguage,
      needsGeneralKnowledge,
    } as QueryClassification & { needsGeneralKnowledge: boolean };
  }

  extractChineseCharacters(query: string): string[] {
    const matches = query.match(/[\u4e00-\u9fff]/g);
    return matches ? [...new Set(matches)] : [];
  }

  detectHskLevel(query: string): number | undefined {
    const hskMatch = query.match(/hsk\s*(\d)/i);
    return hskMatch ? parseInt(hskMatch[1]) : undefined;
  }
}
```

#### 7.2 Main RAG Query Service

Create `src/modules/rag/services/rag-query.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import {
  DataExtractorService,
  ContentChunkType,
} from './data-extractor.service';
import { EmbeddingService } from './embedding.service';
import { VectorStoreService, SearchOptions } from './vector-store.service';
import { LLMService } from './llm.service';
import {
  QueryClassifierService,
  QueryClassification,
} from './query-classifier.service';

export interface RagQueryOptions {
  userLevel?: number;
  maxResults?: number;
  includeContext?: boolean;
  temperature?: number;
}

export interface RagResponse {
  answer: string;
  sources: Array<{
    id: string;
    type: string;
    content: string;
    score: number;
    metadata: any;
  }>;
  classification: QueryClassification;
  processingTime: number;
}

@Injectable()
export class RagQueryService {
  constructor(
    private dataExtractor: DataExtractorService,
    private embeddingService: EmbeddingService,
    private vectorStore: VectorStoreService,
    private llmService: LLMService,
    private queryClassifier: QueryClassifierService,
  ) {}

  async processQuery(
    query: string,
    options: RagQueryOptions = {},
  ): Promise<RagResponse> {
    const startTime = Date.now();

    const {
      userLevel = 3,
      maxResults = 5,
      includeContext = true,
      temperature = 0.7,
    } = options;

    try {
      // Step 1: Classify the query
      const classification = this.queryClassifier.classifyQuery(query);

      if (!classification.isChineseLearning) {
        return {
          answer:
            'I can only help with Chinese language learning questions. Please ask about Chinese words, grammar, pronunciation, or lessons.',
          sources: [],
          classification,
          processingTime: Date.now() - startTime,
        };
      }

      // Step 2: Generate query embedding
      const queryEmbedding =
        await this.embeddingService.generateEmbedding(query);

      // Step 3: Search vector database
      const searchOptions: SearchOptions = {
        limit: maxResults,
        maxHskLevel: classification.detectedHskLevel || userLevel,
        contentTypes: classification.relevantTypes,
        minSimilarity: 0.3,
      };

      const searchResults = await this.vectorStore.search(
        query,
        queryEmbedding,
        searchOptions,
      );

      // Step 4: Build context from retrieved chunks
      const context = this.buildContext(searchResults);

      // Step 5: Generate response with LLM
      const answer = await this.generateResponse(
        query,
        context,
        classification,
        userLevel,
        temperature,
      );

      return {
        answer,
        sources: searchResults.map((r) => ({
          id: r.id,
          type: r.metadata.type,
          content: r.content.substring(0, 200) + '...',
          score: r.score,
          metadata: r.metadata,
        })),
        classification,
        processingTime: Date.now() - startTime,
      };
    } catch (error) {
      console.error('Error processing RAG query:', error);

      return {
        answer:
          'I apologize, but I encountered an error processing your question. Please try again or rephrase your question.',
        sources: [],
        classification: {
          isChineseLearning: false,
          queryType: 'non_chinese',
          confidence: 0,
          relevantTypes: [],
          detectedLanguage: 'en',
        },
        processingTime: Date.now() - startTime,
      };
    }
  }

  private buildContext(
    searchResults: Array<{ content: string; metadata: any; score: number }>,
  ): string {
    if (searchResults.length === 0) {
      return 'No relevant information found in the database.';
    }

    let context =
      'Relevant information from the Chinese learning database:\n\n';

    searchResults.forEach((result, index) => {
      context += `Source ${index + 1} (Relevance: ${(result.score * 100).toFixed(1)}%):\n`;
      context += `Type: ${result.metadata.type}\n`;
      context += `HSK Level: ${result.metadata.hskLevel}\n`;
      context += `Content: ${result.content}\n\n`;
    });

    return context;
  }

  private async generateResponse(
    query: string,
    context: string,
    classification: QueryClassification,
    userLevel: number,
    temperature: number,
  ): Promise<string> {
    const systemPrompt = this.buildSystemPrompt(classification, userLevel);

    const fullPrompt = `${systemPrompt}

Context from Chinese learning database:
${context}

User question: ${query}
User HSK Level: ${userLevel}
Query type: ${classification.queryType}

Instructions:
- Answer the user's question using the context provided when available
- If the context doesn't contain relevant information, provide general Chinese learning guidance
- Keep explanations appropriate for HSK Level ${userLevel}
- Always include pinyin for Chinese characters in parentheses
- Be concise but helpful
- Only answer Chinese language learning questions

Answer:`;

    return await this.llmService.generateResponse(fullPrompt, {
      temperature,
      max_tokens: 500,
    });
  }

  private buildSystemPrompt(
    classification: QueryClassification,
    userLevel: number,
  ): string {
    const basePrompt = `You are a helpful Chinese language learning assistant specialized in Mandarin Chinese.`;

    switch (classification.queryType) {
      case 'word_lookup':
        return `${basePrompt} You help students understand Chinese word meanings, pronunciations, and usage. Focus on providing clear definitions with pinyin and practical examples.`;

      case 'grammar_question':
        return `${basePrompt} You help students understand Chinese grammar patterns, sentence structures, and usage rules. Explain grammar clearly with examples and common mistakes to avoid.`;

      case 'lesson_help':
        return `${basePrompt} You help students with their Chinese lessons and practice exercises. Provide step-by-step explanations and learning tips.`;

      case 'practice_question':
        return `${basePrompt} You help students practice Chinese through interactive questions and exercises. Provide clear feedback and explanations.`;

      default:
        return `${basePrompt} You answer general Chinese language learning questions covering vocabulary, grammar, pronunciation, and cultural context.`;
    }
  }

  // Utility method to populate vector database
  async populateVectorDatabase(
    options: {
      words?: number;
      grammar?: number;
      content?: number;
      questions?: number;
    } = {},
  ) {
    const { words = 100, grammar = 50, content = 20, questions = 30 } = options;

    console.log('🚀 Starting vector database population...');

    try {
      const allChunks: ContentChunkType[] = [];

      // Extract words
      if (words > 0) {
        console.log(`📖 Extracting ${words} word entries...`);
        const wordChunks = await this.dataExtractor.extractWords(words);
        allChunks.push(...wordChunks);
        console.log(`✅ Extracted ${wordChunks.length} word chunks`);
      }

      // Extract grammar patterns
      if (grammar > 0) {
        console.log(`📝 Extracting ${grammar} grammar patterns...`);
        const grammarChunks = await this.dataExtractor.extractGrammar(grammar);
        allChunks.push(...grammarChunks);
        console.log(`✅ Extracted ${grammarChunks.length} grammar chunks`);
      }

      // Extract lesson content
      if (content > 0) {
        console.log(`📚 Extracting ${content} lesson content items...`);
        const contentChunks =
          await this.dataExtractor.extractLessonContent(content);
        allChunks.push(...contentChunks);
        console.log(`✅ Extracted ${contentChunks.length} content chunks`);
      }

      // Extract questions
      if (questions > 0) {
        console.log(`❓ Extracting ${questions} practice questions...`);
        const questionChunks =
          await this.dataExtractor.extractQuestions(questions);
        allChunks.push(...questionChunks);
        console.log(`✅ Extracted ${questionChunks.length} question chunks`);
      }

      if (allChunks.length === 0) {
        throw new Error('No chunks extracted from database');
      }

      // Generate embeddings
      console.log(`🔄 Generating embeddings for ${allChunks.length} chunks...`);
      const texts = allChunks.map((chunk) => chunk.text);
      const embeddings = await this.embeddingService.batchEmbed(texts, 10);
      console.log(`✅ Generated ${embeddings.length} embeddings`);

      // Store in vector database
      console.log(`💾 Storing chunks in vector database...`);
      await this.vectorStore.addChunks(allChunks, embeddings);

      const info = await this.vectorStore.getCollectionInfo();
      console.log(`✅ Vector database populated successfully!`);
      console.log(`📊 Total chunks in database: ${info.count}`);

      return {
        success: true,
        totalChunks: allChunks.length,
        breakdown: {
          words: allChunks.filter((c) => c.type === 'word_definition').length,
          grammar: allChunks.filter((c) => c.type === 'grammar_pattern').length,
          content: allChunks.filter((c) => c.type === 'lesson_content').length,
          questions: allChunks.filter((c) => c.type === 'lesson_question')
            .length,
        },
      };
    } catch (error) {
      console.error('❌ Error populating vector database:', error);
      throw error;
    }
  }
}
```

**Deliverable**: Complete RAG system with local Qwen 2.5 3B model

---

## Phase 4: Testing and Validation

### Step 8: Create Test Endpoints

#### 8.1 DTOs

Create `src/modules/rag/dto/` directory with the following files:

`rag-query.dto.ts`:

```typescript
import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsArray,
  IsNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RagQueryDto {
  @ApiProperty({
    description: "The user's question about Chinese learning",
    example: 'What does 你好 mean?',
  })
  @IsString()
  question: string;

  @ApiPropertyOptional({
    description: "User's HSK level (1-6)",
    example: 3,
    minimum: 1,
    maximum: 6,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(6)
  userLevel?: number;

  @ApiPropertyOptional({
    description: 'Maximum number of results to return',
    example: 5,
    minimum: 1,
    maximum: 20,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  maxResults?: number;

  @ApiPropertyOptional({
    description: 'Temperature for LLM response (0.0 - 1.0)',
    example: 0.7,
    minimum: 0,
    maximum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  temperature?: number;
}
```

`populate-db.dto.ts`:

```typescript
import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PopulateDbDto {
  @ApiPropertyOptional({
    description: 'Number of words to extract and embed',
    example: 100,
    minimum: 0,
    maximum: 1000,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1000)
  words?: number;

  @ApiPropertyOptional({
    description: 'Number of grammar patterns to extract and embed',
    example: 50,
    minimum: 0,
    maximum: 500,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(500)
  grammar?: number;

  @ApiPropertyOptional({
    description: 'Number of lesson content items to extract and embed',
    example: 20,
    minimum: 0,
    maximum: 200,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(200)
  content?: number;

  @ApiPropertyOptional({
    description: 'Number of practice questions to extract and embed',
    example: 30,
    minimum: 0,
    maximum: 300,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(300)
  questions?: number;
}
```

`search-query.dto.ts`:

```typescript
import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SearchQueryDto {
  @ApiProperty({
    description: 'Text to search for',
    example: 'hello greeting',
  })
  @IsString()
  text: string;

  @ApiPropertyOptional({
    description: 'Maximum HSK level for results',
    example: 3,
    minimum: 1,
    maximum: 6,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(6)
  hskLevel?: number;

  @ApiPropertyOptional({
    description: 'Maximum number of results',
    example: 5,
    minimum: 1,
    maximum: 20,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  limit?: number;

  @ApiPropertyOptional({
    description: 'Content types to search',
    example: ['word_definition', 'grammar_pattern'],
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  contentTypes?: string[];
}
```

#### 8.2 RAG Controller

Create `src/modules/rag/rag.controller.ts`:

```typescript
import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RagQueryService } from './services/rag-query.service';
import { VectorStoreService } from './services/vector-store.service';
import { LLMService } from './services/llm.service';
import { RagQueryDto } from './dto/rag-query.dto';
import { PopulateDbDto } from './dto/populate-db.dto';
import { SearchQueryDto } from './dto/search-query.dto';

@ApiTags('RAG - Retrieval Augmented Generation')
@Controller('rag')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RagController {
  constructor(
    private readonly ragQueryService: RagQueryService,
    private readonly vectorStoreService: VectorStoreService,
    private readonly llmService: LLMService,
  ) {}

  @Post('query')
  @ApiOperation({
    summary: 'Ask a Chinese learning question',
    description:
      'Process a Chinese language learning question using RAG (Retrieval Augmented Generation)',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully processed the question',
    schema: {
      example: {
        answer:
          "你好 (nǐ hǎo) means 'hello' in Chinese. It's the most common greeting in Mandarin and is appropriate for any time of day. This is an HSK Level 1 word that every Chinese learner should know.",
        sources: [
          {
            id: 'word_123_456',
            type: 'word_definition',
            content: 'Chinese word: 你好 Pinyin: nǐ hǎo Meaning: hello...',
            score: 0.95,
            metadata: { hskLevel: 1, type: 'word_definition' },
          },
        ],
        classification: {
          isChineseLearning: true,
          queryType: 'word_lookup',
          confidence: 0.85,
          relevantTypes: ['word_definition'],
          detectedLanguage: 'mixed',
        },
        processingTime: 1250,
      },
    },
  })
  async queryKnowledge(@Body() dto: RagQueryDto) {
    return await this.ragQueryService.processQuery(dto.question, {
      userLevel: dto.userLevel,
      maxResults: dto.maxResults,
      temperature: dto.temperature,
    });
  }

  @Post('populate')
  @ApiOperation({
    summary: 'Populate vector database',
    description:
      'Extract data from MySQL and populate the vector database with embeddings',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully populated vector database',
    schema: {
      example: {
        success: true,
        totalChunks: 200,
        breakdown: {
          words: 100,
          grammar: 50,
          content: 20,
          questions: 30,
        },
      },
    },
  })
  async populateVectorDb(@Body() dto: PopulateDbDto) {
    return await this.ragQueryService.populateVectorDatabase(dto);
  }

  @Get('search')
  @ApiOperation({
    summary: 'Search vector database',
    description: 'Perform similarity search in the vector database',
  })
  @ApiResponse({
    status: 200,
    description: 'Search results from vector database',
    schema: {
      example: [
        {
          id: 'word_123_456',
          score: 0.89,
          content: 'Chinese word: 你好 Pinyin: nǐ hǎo...',
          metadata: { type: 'word_definition', hskLevel: 1 },
        },
      ],
    },
  })
  async searchSimilar(@Query() query: SearchQueryDto) {
    const queryEmbedding = await this.ragQueryService[
      'embeddingService'
    ].generateEmbedding(query.text);

    return await this.vectorStoreService.search(query.text, queryEmbedding, {
      limit: query.limit,
      maxHskLevel: query.hskLevel,
      contentTypes: query.contentTypes,
    });
  }

  @Get('status')
  @ApiOperation({
    summary: 'Get RAG system status',
    description: 'Check the status of all RAG system components',
  })
  @ApiResponse({
    status: 200,
    description: 'RAG system status information',
    schema: {
      example: {
        vectorStore: {
          name: 'chinese_learning_content',
          count: 200,
          isReady: true,
        },
        llm: {
          model: 'qwen2.5:3b-instruct',
          apiUrl: 'http://localhost:11434',
          provider: 'ollama',
          isAvailable: true,
        },
        embedding: {
          model: 'Xenova/all-MiniLM-L6-v2',
          isReady: true,
        },
      },
    },
  })
  async getSystemStatus() {
    const vectorStoreInfo = await this.vectorStoreService.getCollectionInfo();
    const llmInfo = this.llmService.getModelInfo();
    const isLlmAvailable = await this.llmService.isModelAvailable();

    return {
      vectorStore: vectorStoreInfo,
      llm: {
        ...llmInfo,
        isAvailable: isLlmAvailable,
      },
      embedding: {
        model: process.env.RAG_EMBEDDING_MODEL || 'Xenova/all-MiniLM-L6-v2',
        isReady: true,
      },
    };
  }

  @Post('clear')
  @ApiOperation({
    summary: 'Clear vector database',
    description: 'Clear all data from the vector database',
  })
  @ApiResponse({
    status: 200,
    description: 'Vector database cleared successfully',
  })
  async clearVectorDb() {
    return await this.vectorStoreService.clearCollection();
  }

  @Get('test-samples')
  @ApiOperation({
    summary: 'Get test query samples',
    description: 'Get sample queries for testing the RAG system',
  })
  @ApiResponse({
    status: 200,
    description: 'Sample test queries',
    schema: {
      example: {
        wordLookup: [
          'What does 你好 mean?',
          'How do you pronounce 中文?',
          'What is the meaning of 谢谢?',
        ],
        grammar: [
          'How do I use 要 in a sentence?',
          'What is the difference between 是 and 有?',
          'Explain the grammar pattern Subject + 在 + Place',
        ],
        general: [
          'Show me HSK 1 words about greetings',
          'What are some common Chinese phrases?',
          'Help me practice basic Chinese grammar',
        ],
      },
    },
  })
  getTestSamples() {
    return {
      wordLookup: [
        'What does 你好 mean?',
        'How do you pronounce 中文?',
        'What is the meaning of 谢谢?',
        'Define the word 学习',
        'What does 再见 mean in English?',
      ],
      grammar: [
        'How do I use 要 in a sentence?',
        'What is the difference between 是 and 有?',
        'Explain the grammar pattern Subject + 在 + Place',
        'When do I use 了?',
        'How to form questions in Chinese?',
      ],
      general: [
        'Show me HSK 1 words about greetings',
        'What are some common Chinese phrases?',
        'Help me practice basic Chinese grammar',
        'What should I learn first in Chinese?',
        'How do Chinese tones work?',
      ],
      mixed: [
        '我想学中文，从哪里开始？',
        'What does 我爱你 mean and how do you use it?',
        'Explain the difference between 你 and 您',
      ],
    };
  }
}
```

#### 8.3 RAG Module

Create `src/modules/rag/rag.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

// Import entities
import { Word } from '../words/entities/word.entity';
import { WordSense } from '../words/entities/word-sense.entity';
import { WordSenseTranslation } from '../words/entities/word-sense-translation.entity';
import { GrammarPattern } from '../grammar/entities/grammar-pattern.entity';
import { GrammarTranslation } from '../grammar/entities/grammar-translation.entity';
import { Content } from '../lessons/entities/content.entity';
import { Question } from '../lessons/entities/question.entity';
import { Lessons } from '../lessons/entities/lesson.entities';

// Import services
import { DataExtractorService } from './services/data-extractor.service';
import { ChunkerService } from './services/chunker.service';
import { EmbeddingService } from './services/embedding.service';
import { VectorStoreService } from './services/vector-store.service';
import { LLMService } from './services/llm.service';
import { QueryClassifierService } from './services/query-classifier.service';
import { RagQueryService } from './services/rag-query.service';

// Import controller
import { RagController } from './rag.controller';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      Word,
      WordSense,
      WordSenseTranslation,
      GrammarPattern,
      GrammarTranslation,
      Content,
      Question,
      Lessons,
    ]),
  ],
  controllers: [RagController],
  providers: [
    DataExtractorService,
    ChunkerService,
    EmbeddingService,
    VectorStoreService,
    LLMService,
    QueryClassifierService,
    RagQueryService,
  ],
  exports: [RagQueryService, VectorStoreService, EmbeddingService],
})
export class RagModule {}
```

#### 8.4 Add to App Module

Update `src/app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
// ... other imports
import { RagModule } from './modules/rag/rag.module';

@Module({
  imports: [
    // ... other modules
    RagModule,
  ],
  // ... rest of the configuration
})
export class AppModule {}
```

**Sample Test Queries:**

- "What does 你好 mean?"
- "How do I use 要 in a sentence?"
- "Show me HSK 1 words with 'water'"
- "Explain Chinese grammar for beginners"
- "What is the difference between 是 and 有?"

**Deliverable**: REST API endpoints for testing RAG functionality

---

## Phase 5: Production Migration

### Step 9: Cloud Migration Strategy

#### 9.1 Abstract Model Interface

Create `src/modules/rag/interfaces/llm.interface.ts`:

```typescript
export interface LLMOptions {
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  model?: string;
}

export interface LLMResponse {
  response: string;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  finish_reason?: string;
}

export interface LLMProvider {
  generateResponse(prompt: string, options?: LLMOptions): Promise<string>;
  isAvailable(): Promise<boolean>;
  getModelInfo(): {
    model: string;
    provider: string;
    apiUrl?: string;
  };
}
```

#### 9.2 Local LLM Implementation

Update `src/modules/rag/services/llm.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LLMProvider, LLMOptions } from '../interfaces/llm.interface';

@Injectable()
export class LocalLLMService implements LLMProvider {
  private readonly apiUrl: string;
  private readonly model: string;

  constructor(private configService: ConfigService) {
    this.apiUrl = this.configService.get(
      'RAG_LLM_API_URL',
      'http://localhost:11434',
    );
    this.model = this.configService.get('RAG_LLM_MODEL', 'qwen2.5:3b-instruct');
  }

  async generateResponse(
    prompt: string,
    options: LLMOptions = {},
  ): Promise<string> {
    const { temperature = 0.7, max_tokens = 1000, stream = false } = options;

    try {
      const response = await fetch(`${this.apiUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          prompt: prompt,
          stream,
          options: {
            temperature,
            num_predict: max_tokens,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error('❌ Error calling local LLM:', error);
      throw new Error(`Failed to generate response: ${error.message}`);
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/api/tags`);
      if (!response.ok) return false;

      const data = await response.json();
      return data.models?.some((m: any) => m.name === this.model) || false;
    } catch {
      return false;
    }
  }

  getModelInfo() {
    return {
      model: this.model,
      provider: 'ollama-local',
      apiUrl: this.apiUrl,
    };
  }
}
```

#### 9.3 Cloud LLM Implementation

Create `src/modules/rag/services/cloud-llm.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LLMProvider, LLMOptions } from '../interfaces/llm.interface';

@Injectable()
export class CloudLLMService implements LLMProvider {
  private readonly apiKey: string;
  private readonly apiUrl: string;
  private readonly model: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get('RAG_CLOUD_API_KEY');
    this.apiUrl = this.configService.get(
      'RAG_CLOUD_API_URL',
      'https://api.openai.com/v1/chat/completions',
    );
    this.model = this.configService.get('RAG_CLOUD_MODEL', 'gpt-oss-20b');
  }

  async generateResponse(
    prompt: string,
    options: LLMOptions = {},
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Cloud API key not configured');
    }

    const {
      temperature = 0.7,
      max_tokens = 1000,
      model = this.model,
    } = options;

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature,
          max_tokens,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('❌ Error calling cloud LLM:', error);
      throw new Error(`Failed to generate response: ${error.message}`);
    }
  }

  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) return false;

    try {
      // Simple health check
      const response = await fetch(
        this.apiUrl.replace('/chat/completions', '/models'),
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
        },
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  getModelInfo() {
    return {
      model: this.model,
      provider: 'openai-compatible-cloud',
      apiUrl: this.apiUrl,
    };
  }
}
```

#### 9.4 LLM Factory Service

Create `src/modules/rag/services/llm-factory.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LLMProvider } from '../interfaces/llm.interface';
import { LocalLLMService } from './llm.service';
import { CloudLLMService } from './cloud-llm.service';

@Injectable()
export class LLMFactoryService {
  constructor(
    private configService: ConfigService,
    private localLLMService: LocalLLMService,
    private cloudLLMService: CloudLLMService,
  ) {}

  getLLMProvider(): LLMProvider {
    const modelType = this.configService.get('RAG_MODEL_TYPE', 'local');

    switch (modelType) {
      case 'cloud':
        return this.cloudLLMService;
      case 'local':
      default:
        return this.localLLMService;
    }
  }

  async getAvailableProvider(): Promise<LLMProvider> {
    const providers = [
      this.getLLMProvider(),
      // Fallback to the other provider if primary is not available
      this.getLLMProvider() === this.localLLMService
        ? this.cloudLLMService
        : this.localLLMService,
    ];

    for (const provider of providers) {
      if (await provider.isAvailable()) {
        return provider;
      }
    }

    throw new Error('No LLM providers are available');
  }
}
```

#### 9.5 Update Environment Variables

Add to `.env`:

```env
# RAG Configuration
RAG_MODEL_TYPE=local  # local | cloud
RAG_EMBEDDING_MODEL=Xenova/all-MiniLM-L6-v2
RAG_VECTOR_DB_URL=http://localhost:8000

# Local Model Configuration
RAG_LLM_API_URL=http://localhost:11434
RAG_LLM_MODEL=qwen2.5:3b-instruct

# Cloud Model Configuration (for production)
RAG_CLOUD_API_KEY=your_api_key_here
RAG_CLOUD_API_URL=https://your-api-endpoint.com/v1/chat/completions
RAG_CLOUD_MODEL=gpt-oss-20b

# Production Vector Database (optional)
RAG_PINECONE_API_KEY=your_pinecone_key
RAG_PINECONE_INDEX=chinese-learning-vectors
```

**Deliverable**: Flexible architecture for switching between local and cloud models

---

### Step 10: Fine-tuning Data Preparation

#### 10.1 Fine-tuning Service

Create `src/modules/rag/services/fine-tuning.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { DataExtractorService } from './data-extractor.service';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface TrainingExample {
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
}

export interface FineTuningDataset {
  examples: TrainingExample[];
  statistics: {
    totalExamples: number;
    averageLength: number;
    categories: Record<string, number>;
  };
}

@Injectable()
export class FineTuningService {
  constructor(private dataExtractor: DataExtractorService) {}

  async generateTrainingData(): Promise<FineTuningDataset> {
    const examples: TrainingExample[] = [];
    const categories: Record<string, number> = {};

    // Generate word definition examples
    const wordChunks = await this.dataExtractor.extractWords(200);
    for (const word of wordChunks) {
      examples.push({
        messages: [
          {
            role: 'system',
            content:
              "You are a helpful Chinese language learning assistant. Provide clear, concise explanations appropriate for the user's HSK level.",
          },
          {
            role: 'user',
            content: `What does ${word.chinese} mean?`,
          },
          {
            role: 'assistant',
            content: `${word.chinese} (${word.pinyin}) means "${word.meaning}". It's ${word.partOfSpeech ? `a ${word.partOfSpeech}` : 'used'} and is taught at HSK Level ${word.hskLevel}.${word.example ? ` Example usage: ${word.example}` : ''}`,
          },
        ],
      });

      examples.push({
        messages: [
          {
            role: 'system',
            content: 'You are a helpful Chinese language learning assistant.',
          },
          {
            role: 'user',
            content: `How do you pronounce ${word.chinese}?`,
          },
          {
            role: 'assistant',
            content: `${word.chinese} is pronounced "${word.pinyin}" in pinyin. It means "${word.meaning}" and is an HSK Level ${word.hskLevel} word.`,
          },
        ],
      });

      categories['word_definitions'] =
        (categories['word_definitions'] || 0) + 2;
    }

    // Generate grammar examples
    const grammarChunks = await this.dataExtractor.extractGrammar(100);
    for (const grammar of grammarChunks) {
      examples.push({
        messages: [
          {
            role: 'system',
            content:
              'You are a helpful Chinese language learning assistant specializing in grammar.',
          },
          {
            role: 'user',
            content: `How do I use the grammar pattern "${grammar.pattern}"?`,
          },
          {
            role: 'assistant',
            content: `The grammar pattern "${grammar.pattern}" ${grammar.pinyin ? `(${grammar.pinyin})` : ''} is used to ${grammar.explanation}. ${grammar.formula ? `The structure is: ${grammar.formula}. ` : ''}${grammar.examples.length > 0 ? `Examples: ${grammar.examples.join(', ')}` : ''} This is taught at HSK Level ${grammar.hskLevel}.`,
          },
        ],
      });

      categories['grammar_patterns'] =
        (categories['grammar_patterns'] || 0) + 1;
    }

    // Generate lesson content examples
    const contentChunks = await this.dataExtractor.extractLessonContent(50);
    for (const content of contentChunks) {
      examples.push({
        messages: [
          {
            role: 'system',
            content: 'You are a helpful Chinese language learning assistant.',
          },
          {
            role: 'user',
            content: `Tell me about ${content.lessonTitle}`,
          },
          {
            role: 'assistant',
            content: `${content.lessonTitle} is an HSK Level ${content.hskLevel} lesson focusing on ${content.contentType.toLowerCase().replace('_', ' ')}. This lesson helps you learn essential Chinese concepts and vocabulary.`,
          },
        ],
      });

      categories['lesson_content'] = (categories['lesson_content'] || 0) + 1;
    }

    // Generate question examples
    const questionChunks = await this.dataExtractor.extractQuestions(75);
    for (const question of questionChunks) {
      if (question.questionText && question.correctAnswer) {
        examples.push({
          messages: [
            {
              role: 'system',
              content:
                'You are a helpful Chinese language learning assistant providing practice questions.',
            },
            {
              role: 'user',
              content: question.questionText,
            },
            {
              role: 'assistant',
              content: `${question.correctAnswer}${question.explanation ? ` - ${question.explanation}` : ''}`,
            },
          ],
        });

        categories['practice_questions'] =
          (categories['practice_questions'] || 0) + 1;
      }
    }

    // Calculate statistics
    const totalLength = examples.reduce(
      (sum, ex) =>
        sum +
        ex.messages.reduce((msgSum, msg) => msgSum + msg.content.length, 0),
      0,
    );

    return {
      examples,
      statistics: {
        totalExamples: examples.length,
        averageLength: Math.round(totalLength / examples.length),
        categories,
      },
    };
  }

  async exportForFineTuning(
    format: 'jsonl' | 'csv' = 'jsonl',
    outputPath?: string,
  ): Promise<string> {
    const dataset = await this.generateTrainingData();

    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const fileName = `chinese_learning_finetuning_${timestamp}.${format}`;
    const filePath = outputPath
      ? path.join(outputPath, fileName)
      : path.join(process.cwd(), 'data', fileName);

    // Ensure directory exists
    await fs.mkdir(path.dirname(filePath), { recursive: true });

    if (format === 'jsonl') {
      const jsonlContent = dataset.examples
        .map((example) => JSON.stringify(example))
        .join('\n');

      await fs.writeFile(filePath, jsonlContent, 'utf-8');
    } else if (format === 'csv') {
      // CSV format for some fine-tuning platforms
      const csvRows = ['prompt,response'];

      for (const example of dataset.examples) {
        const userMessage =
          example.messages.find((m) => m.role === 'user')?.content || '';
        const assistantMessage =
          example.messages.find((m) => m.role === 'assistant')?.content || '';

        if (userMessage && assistantMessage) {
          csvRows.push(
            `"${userMessage.replace(/"/g, '""')}","${assistantMessage.replace(/"/g, '""')}"`,
          );
        }
      }

      await fs.writeFile(filePath, csvRows.join('\n'), 'utf-8');
    }

    // Create statistics file
    const statsFile = filePath.replace(/\.(jsonl|csv)$/, '_stats.json');
    await fs.writeFile(
      statsFile,
      JSON.stringify(dataset.statistics, null, 2),
      'utf-8',
    );

    console.log(`✅ Fine-tuning data exported to: ${filePath}`);
    console.log(`📊 Statistics saved to: ${statsFile}`);
    console.log(`📈 Dataset stats:`, dataset.statistics);

    return filePath;
  }

  async generateValidationSet(
    trainDataPath: string,
    validationRatio = 0.2,
  ): Promise<string> {
    const trainData = await fs.readFile(trainDataPath, 'utf-8');
    const examples = trainData
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => JSON.parse(line));

    // Shuffle and split
    const shuffled = examples.sort(() => Math.random() - 0.5);
    const validationSize = Math.floor(examples.length * validationRatio);

    const validationData = shuffled.slice(0, validationSize);
    const remainingTrainData = shuffled.slice(validationSize);

    // Save validation set
    const validationPath = trainDataPath.replace('.jsonl', '_validation.jsonl');
    const validationContent = validationData
      .map((ex) => JSON.stringify(ex))
      .join('\n');
    await fs.writeFile(validationPath, validationContent, 'utf-8');

    // Update training set
    const trainContent = remainingTrainData
      .map((ex) => JSON.stringify(ex))
      .join('\n');
    await fs.writeFile(trainDataPath, trainContent, 'utf-8');

    console.log(
      `✅ Validation set created: ${validationPath} (${validationData.length} examples)`,
    );
    console.log(
      `✅ Training set updated: ${trainDataPath} (${remainingTrainData.length} examples)`,
    );

    return validationPath;
  }
}
```

**Deliverable**: Fine-tuning data preparation system

---

## Implementation Timeline

### Week 1: Infrastructure Setup

- **Days 1-2**: Set up NestJS RAG module structure
- **Days 3-4**: Implement data extraction from MySQL
- **Days 5-7**: Create chunking strategies and services

### Week 2: Embedding and Storage

- **Days 1-2**: Set up local embedding model (sentence-transformers)
- **Days 3-4**: Implement ChromaDB vector storage
- **Days 5-7**: Test embedding generation and similarity search

### Week 3: LLM Integration

- **Days 1-2**: Install and configure Qwen 2.5 3B with Ollama
- **Days 3-4**: Implement query classification and RAG processing
- **Days 5-7**: Build complete RAG pipeline with local model

### Week 4: Testing and Validation

- **Days 1-3**: Create API endpoints and comprehensive testing
- **Days 4-5**: Test with sample queries and optimize responses
- **Days 6-7**: Performance testing and bug fixes

### Week 5: Production Preparation

- **Days 1-2**: Implement cloud LLM service abstraction
- **Days 3-4**: Prepare fine-tuning datasets
- **Days 5-7**: Documentation and deployment preparation

## Testing Checklist

### Basic Functionality

- [ ] Data extraction from MySQL works correctly
- [ ] Embedding generation produces valid vectors
- [ ] Vector storage and retrieval functions
- [ ] LLM integration responds to prompts
- [ ] RAG pipeline processes queries end-to-end

### API Endpoints

- [ ] `/rag/query` - Question processing
- [ ] `/rag/populate` - Database population
- [ ] `/rag/search` - Similarity search
- [ ] `/rag/status` - System health check
- [ ] `/rag/clear` - Database clearing

### Sample Queries

- [ ] Word definitions: "What does 你好 mean?"
- [ ] Grammar questions: "How do I use 要?"
- [ ] HSK-specific queries: "Show me HSK 1 words"
- [ ] Mixed language: "我想学中文，从哪里开始？"
- [ ] Non-Chinese queries (should be rejected)

### Performance Metrics

- [ ] Query response time < 5 seconds
- [ ] Embedding generation time acceptable
- [ ] Vector search returns relevant results
- [ ] Memory usage within reasonable limits
- [ ] Error handling for edge cases

## Production Deployment Notes

### Environment Variables

```env
# Switch to cloud for production
RAG_MODEL_TYPE=cloud
RAG_CLOUD_API_KEY=your_production_key
RAG_CLOUD_MODEL=gpt-oss-20b

# Consider cloud vector database
RAG_VECTOR_DB_URL=https://your-pinecone-index.com
```

### Monitoring

- Set up logging for query processing times
- Monitor embedding generation performance
- Track LLM API usage and costs
- Alert on system component failures

### Scaling Considerations

- Use read replicas for MySQL queries
- Consider distributed vector storage
- Implement query result caching
- Load balance multiple LLM endpoints

This guide provides a complete roadmap for implementing RAG with your Chinese language learning database, starting with local development and preparing for cloud production deployment.
