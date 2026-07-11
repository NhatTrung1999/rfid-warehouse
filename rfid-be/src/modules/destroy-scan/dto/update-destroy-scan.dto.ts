import { PartialType } from '@nestjs/mapped-types';
import { CreateDestroyScanDto } from './create-destroy-scan.dto';

export class UpdateDestroyScanDto extends PartialType(CreateDestroyScanDto) {}
