import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, Validate } from 'class-validator';
import { isDate } from '../validation/isDate';

export default class ReportDto {
  @ApiProperty({
    example: '2021-01',
    description: 'The month of the report',
  })
  @IsNotEmpty()
  @Validate(isDate)
  month: string;
}
