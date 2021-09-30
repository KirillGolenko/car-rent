import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import ReservationsAvailabilityDto from './dto/reservations-availability.dto';
import ReservationsCreateDto from './dto/reservations-create.dto';
import ReportDto from './dto/report.dto';

@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Get('/availability')
  checkCarAvailability(
    @Query() carAvailabilityDto: ReservationsAvailabilityDto,
  ) {
    return this.reservationsService.checkCarsAvailability(carAvailabilityDto);
  }

  @Post()
  insertReservations(@Body() reservationsCreateDto: ReservationsCreateDto) {
    return this.reservationsService.insertRent(reservationsCreateDto);
  }

  @Get('/report')
  sendReport(@Query() reportDto: ReportDto) {
    return this.reservationsService.sendReport(reportDto);
  }
}
