import { IsOptional, IsInt, IsString, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class GetGrammarTranslationsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  grammarPatternId?: number;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  sortBy?: string = 'id';

  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: any }): string =>
    typeof value === 'string' ? value.toUpperCase() : 'ASC',
  )
  sortOrder?: 'ASC' | 'DESC' = 'ASC';
}
