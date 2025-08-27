import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Content } from './entities/content.entity';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';

@Injectable()
export class ContentService {
  constructor(
    @InjectRepository(Content)
    private contentRepository: Repository<Content>,
  ) {}

  async create(createContentDto: CreateContentDto): Promise<Content> {
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

  async findOne(id: number): Promise<Content> {
    const content = await this.contentRepository.findOne({
      where: { id, isActive: true },
    });
    
    if (!content) {
      throw new NotFoundException(`Content with ID ${id} not found`);
    }
    
    return content;
  }

  async update(id: number, updateContentDto: UpdateContentDto): Promise<Content> {
    const content = await this.findOne(id);
    Object.assign(content, updateContentDto);
    return await this.contentRepository.save(content);
  }

  async remove(id: number): Promise<void> {
    const content = await this.findOne(id);
    content.isActive = false;
    await this.contentRepository.save(content);
  }

  async hardDelete(id: number): Promise<void> {
    const result = await this.contentRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Content with ID ${id} not found`);
    }
  }
}