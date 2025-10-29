import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity';
import { CreateCategoryDto, CategoryResponseDto } from './dto/category.dto';

@Injectable()
export class CategoriesService {
  constructor(@InjectRepository(Category) private repo: Repository<Category>) {}

  async create(dto: CreateCategoryDto): Promise<CategoryResponseDto> {
    const exists = await this.repo.findOne({ where: { name: dto.name } });
    if (exists) throw new ConflictException('Category already exists');
    
    const category = await this.repo.save(this.repo.create(dto));
    return this.toResponse(category);
  }

  async findAll(): Promise<CategoryResponseDto[]> {
    const categories = await this.repo.find({ order: { name: 'ASC' } });
    return categories.map(c => this.toResponse(c));
  }

  async findOne(id: number): Promise<CategoryResponseDto> {
    const category = await this.repo.findOne({ where: { id } });
    if (!category) throw new NotFoundException('Category not found');
    return this.toResponse(category);
  }

  async update(id: number, dto: CreateCategoryDto): Promise<CategoryResponseDto> {
    const category = await this.repo.findOne({ where: { id } });
    if (!category) throw new NotFoundException('Category not found');

    const exists = await this.repo.findOne({ where: { name: dto.name } });
    if (exists && exists.id !== id) throw new ConflictException('Category name already exists');

    category.name = dto.name;
    await this.repo.save(category);
    return this.toResponse(category);
  }

  async remove(id: number): Promise<void> {
    const category = await this.repo.findOne({ where: { id } });
    if (!category) throw new NotFoundException('Category not found');
    await this.repo.remove(category);
  }

  private toResponse(category: Category): CategoryResponseDto {
    return { id: category.id, name: category.name, createdAt: category.createdAt };
  }
}