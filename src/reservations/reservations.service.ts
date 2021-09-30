import { Injectable, Logger } from '@nestjs/common';
import * as dayjs from 'dayjs';
import { DatabaseService } from '../database/database.service';
import responseWrapper from '../helpers/response-wrapper';
import ReportDto from './dto/report.dto';
import ReservationsAvailabilityDto from './dto/reservations-availability.dto';
import ReservationsCreateDto from './dto/reservations-create.dto';

@Injectable()
export class ReservationsService {
  private readonly logger = new Logger(ReservationsService.name);

  constructor(private databaseService: DatabaseService) {}

  getDaysDif(start: string, end: string): number {
    const startDate = dayjs(start, 'YYYY-MM-DD');
    const endDate = dayjs(end, 'YYYY-MM-DD');

    return endDate.diff(startDate, 'day') + 1;
  }

  calculateCost(days: number, price: number) {
    let discount = 0;

    if (days >= 15) {
      discount = 0.15;
    } else if (days >= 6) {
      discount = 0.1;
    } else if (days >= 3) {
      discount = 0.05;
    }

    return {
      cost: this.applyDiscount(price * days, discount),
      discount: `${discount * 100}%`,
    };
  }

  async checkCarsAvailability(carAvailabilityDto: ReservationsAvailabilityDto) {
    const { startDate, endDate } = carAvailabilityDto;
    const cars = await this.databaseService.executeQuery(
      `SELECT * FROM "CARS" WHERE ID NOT IN(SELECT car_id FROM "RENT" WHERE '${startDate} ' < end_date AND '${endDate}' > start_date)`,
    );
    return responseWrapper.responseSucces(cars);
  }

  async insertRent(reservationsCreateDto: ReservationsCreateDto) {
    const {
      startDate,
      endDate,
      licence_plate,
      tariff = 1,
    } = reservationsCreateDto;
    const difference = this.getDaysDif(startDate, endDate);
    if (difference > 30) {
      return responseWrapper.responseError('Maximum rental period 30 days');
    }

    const lastAllowedRentEndDate = dayjs(startDate)
      .subtract(3, 'day')
      .format('YYYY-MM-DD');

    const [cars, tariffs] = await Promise.all([
      this.databaseService.executeQuery(
        `SELECT * FROM "CARS" WHERE id NOT IN(SELECT car_id FROM "RENT" WHERE '${lastAllowedRentEndDate} ' < end_date AND '${endDate}' > start_date) AND licence_plate='${licence_plate}'`,
      ),
      this.databaseService.executeQuery(
        `SELECT * FROM "TARIFF" WHERE id = ${tariff}`,
      ),
    ]);

    if (!cars[0]) {
      return responseWrapper.responseError(
        'Cars not found or unavailable at given dates.',
      );
    }

    const { cost, discount } = this.calculateCost(
      difference,
      tariffs[0].price_per_day,
    );

    await this.databaseService.executeQuery(
      `INSERT INTO "RENT" (car_id, start_date, end_date, cost)
      VALUES (${cars[0].id}, '${startDate}', '${endDate}', ${cost})`,
    );
    return responseWrapper.responseSucces({ cost, discount });
  }

  async sendReport(reportDto: ReportDto) {
    const { month } = reportDto;
    let reservations;

    const startDate = dayjs(month).startOf('month').format('YYYY-MM-DD');
    const endDate = dayjs(month).endOf('month').format('YYYY-MM-DD');
    const daysInMonth = dayjs(month).daysInMonth();

    try {
      reservations = await this.databaseService.executeQuery(
        `SELECT start_date, end_date, licence_plate FROM "RENT" JOIN "CARS" ON "CARS"."id" = "RENT"."car_id" WHERE '${startDate}' < end_date AND '${endDate}' > start_date`,
      );
    } catch (err) {
      this.logger.error(err);
    }

    const rentDaysByCar: Record<string, number> = reservations.reduce(
      (acc, curr) => {
        let { start_date, end_date } = curr;
        const { licence_plate } = curr;

        if (dayjs(start_date).format('MMMM') !== dayjs(month).format('MMMM')) {
          start_date = startDate;
        }

        if (dayjs(end_date).format('MMMM') !== dayjs(month).format('MMMM')) {
          end_date = endDate;
        }
        const days = this.getDaysDif(start_date, end_date);

        !acc[licence_plate]
          ? (acc[licence_plate] = days)
          : (acc[licence_plate] += days);

        return acc;
      },
      {},
    );

    const report = Object.entries(rentDaysByCar).reduce((acc, curr) => {
      const percent = (curr[1] / daysInMonth) * 100;
      acc[curr[0]] = { percent: `${percent.toFixed(2)}%` };
      return acc;
    }, {});

    let unsedCars;
    const usedCars = Object.keys(rentDaysByCar).map((car) => `'${car}'`);

    try {
      unsedCars = await this.databaseService.executeQuery(
        `SELECT licence_plate FROM "CARS" WHERE licence_plate NOT IN (${usedCars})`,
      );
    } catch (error) {}

    unsedCars.forEach((car) => {
      report[car.licence_plate] = {
        percent: '0%',
      };
    });

    const allPercent: { percent: string }[] = Object.values(report);

    const total = allPercent.reduce((acc, curr) => {
      return (acc += parseFloat(curr.percent));
    }, 0);

    return { report, total: `${(total / allPercent.length).toFixed(2)}%` };
  }

  private applyDiscount(cost: number, discount: number): number {
    return cost - cost * discount;
  }
}
