import { PartialType } from '@nestjs/swagger';
import { CreatePublicationDto } from './create-publication.dto';
import { IsString, IsOptional } from 'class-validator';

export class UpdatePublicationDto extends PartialType(CreatePublicationDto) {
  @IsString()
  @IsOptional()
  condition?: string;
}
