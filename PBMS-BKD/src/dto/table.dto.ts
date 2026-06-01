import { IsNotEmpty } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateTableDto {
  @IsNotEmpty()
  number!: number;
}

export class UpdateTableDto extends PartialType(CreateTableDto) {}
