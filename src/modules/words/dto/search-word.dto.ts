import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SearchWordDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  simplified: string;
}
