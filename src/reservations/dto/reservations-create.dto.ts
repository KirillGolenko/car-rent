import { ApiProperty } from '@nestjs/swagger';
import {
  isDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Validate,
} from 'class-validator';
import { IsValidDay } from '../validation/IsValidDay';

export default class ReservationsCreateDto {
  @ApiProperty({
    example: 'E256FR',
    description: 'The licence plate',
  })
  @IsNotEmpty()
  licence_plate: string;

  @ApiProperty({
    example: '2021-01-01',
    description: 'The start date of the rent',
  })
  @IsNotEmpty()
  @Validate(isDate)
  @Validate(IsValidDay)
  startDate: string;

  @ApiProperty({
    example: '2021-01-10',
    description: 'The end date of the rent',
  })
  @IsNotEmpty()
  @Validate(isDate)
  @Validate(IsValidDay)
  endDate: string;

  @ApiProperty({
    example: '1',
    description: 'The tariff of the rent',
  })
  @IsOptional()
  @IsNotEmpty()
  @IsNumber()
  tariff: number;
}
