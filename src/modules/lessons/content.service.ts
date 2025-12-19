import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Content } from './entities/content.entity';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { OrderIndexService } from './order-index.service';

@Injectable()
export class ContentService {
  constructor(
    @InjectRepository(Content)
    private contentRepository: Repository<Content>,
    private orderIndexService: OrderIndexService,
  ) {}

  async create(createContentDto: CreateContentDto): Promise<Content> {
    if (createContentDto.orderIndex === undefined) {
      createContentDto.orderIndex = await this.orderIndexService.getNextOrderIndex(createContentDto.lessonId);
    }
    
    const content = this.contentRepository.create(createContentDto);
    return await this.contentRepository.save(content);
  }

  async findAll(): Promise<Content[]> {
    return await this.contentRepository.find({
      where: { isActive: true },
      order: { orderIndex: 'ASC' },
    });
  }

  async findByLessonId(lessonId: number): Promise<Content[]> {
    return await this.contentRepository.find({
      where: { lessonId, isActive: true },
      order: { orderIndex: 'ASC' },
    });
  }

  async findOne(id: number, includeInactive: boolean = false): Promise<Content> {
    const whereClause: { id: number; isActive?: boolean } = { id };
    if (!includeInactive) {
      whereClause.isActive = true;
    }
    
    const content = await this.contentRepository.findOne({
      where: whereClause,
    });
    
    if (!content) {
      throw new NotFoundException(`Content with ID ${id} not found`);
    }
    
    return content;
  }

  async update(id: number, updateContentDto: UpdateContentDto): Promise<Content> {
    console.log('[ContentService.update] Called with id:', id);
    console.log('[ContentService.update] updateContentDto:', JSON.stringify(updateContentDto, null, 2));
    
    const content = await this.findOne(id, true); // Include inactive for updates
    console.log('[ContentService.update] Found content before update:', JSON.stringify(content, null, 2));
    
    Object.assign(content, updateContentDto);
    console.log('[ContentService.update] Content after Object.assign:', JSON.stringify(content, null, 2));
    
    const saved = await this.contentRepository.save(content);
    console.log('[ContentService.update] Saved content:', JSON.stringify(saved, null, 2));
    return saved;
  }

  async remove(id: number): Promise<void> {
    const content = await this.findOne(id, true); // Include inactive for soft delete
    content.isActive = false;
    await this.contentRepository.save(content);
  }

  async hardDelete(id: number): Promise<void> {
    const result = await this.contentRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Content with ID ${id} not found`);
    }
  }

  async restore(id: number): Promise<Content> {
    const content = await this.contentRepository.findOne({
      where: { id },
    });

    if (!content) {
      throw new NotFoundException(`Content with ID ${id} not found`);
    }

    content.isActive = true;
    return this.contentRepository.save(content);
  }
}