import { Injectable, OnModuleInit } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import * as faker from 'faker';
import * as dayjs from 'dayjs';
import { ReservationsService } from 'src/reservations/reservations.service';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(
    private databaseService: DatabaseService,
    private reservationsService: ReservationsService,
  ) {}

  async seed(): Promise<void> {
    let carsCreated = false;
    let rentCreated = false;
    let tariffCreated = false;

    const tableCars = await this.databaseService.executeQuery(
      `SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME='CARS'`,
    );
    const tableRent = await this.databaseService.executeQuery(
      `SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME='RENT'`,
    );
    const tableTariffs = await this.databaseService.executeQuery(
      `SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME='TARIFF'`,
    );

    if (!tableCars[0]) {
      await this.databaseService.executeQuery(
        `CREATE TABLE "CARS" (
        id SERIAL NOT NULL PRIMARY KEY,
        brand VARCHAR(255),
        model VARCHAR(255),
        licence_plate VARCHAR(6)
    )`,
      );
      carsCreated = true;
    }

    if (!tableRent[0]) {
      await this.databaseService.executeQuery(
        `CREATE TABLE "RENT" (
          id SERIAL NOT NULL PRIMARY KEY,
          car_id integer NOT NULL,
          tariff_id integer NOT NULL,
          start_date date NOT NULL,
          end_date date NOT NULL,
          cost money NOT NULL
    )`,
      );
      rentCreated = true;
    }
    if (!tableTariffs[0]) {
      await this.databaseService.executeQuery(
        `CREATE TABLE "TARIFF" (
          id SERIAL NOT NULL PRIMARY KEY,
          price_per_day integer NOT NULL DEFAULT 1000,
          distance_per_day integer NOT NULL DEFAULT 500
    )`,
      );
      tariffCreated = true;
    }

    const carsValues = [];
    const rentValues = [];

    if (carsCreated) {
      for (let i = 0; i < 5; i++) {
        const optionNumber = {
          min: 1,
          max: 9,
        };
        const optionAlpha = {
          upcase: true,
        };
        const model = faker.vehicle.model();
        const brand = faker.vehicle.manufacturer();
        const licence_plate = `${faker.random.alpha(
          optionAlpha,
        )}${faker.datatype.number(optionNumber)}${faker.datatype.number(
          optionNumber,
        )}${faker.datatype.number(optionNumber)}${faker.random.alpha(
          optionAlpha,
        )}${faker.random.alpha(optionAlpha)}`;
        carsValues.push(`('${model}', '${brand}', '${licence_plate}')`);
      }

      await this.databaseService.executeQuery(
        `INSERT INTO "CARS" (model, brand, licence_plate)
        VALUES ${carsValues}`,
      );
    }

    if (tariffCreated) {
      await this.databaseService.executeQuery(
        `INSERT INTO "TARIFF" (price_per_day, distance_per_day) VALUES (1000, 500)`,
      );
    }

    if (rentCreated) {
      for (let i = 1; i < 10; i++) {
        const carId = faker.datatype.number({
          min: 1,
          max: 5,
        });
        const randomNumber = faker.datatype.number({
          min: 1,
          max: 30,
        });
        const tariff = 1;
        const startDate = dayjs(
          faker.date.between('2021-01-01', '2022-01-02'),
        ).format('YYYY-MM-DD');

        const endDate = dayjs(startDate)
          .add(randomNumber, 'day')
          .format('YYYY-MM-DD');
        const date = [startDate, endDate];
        date.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

        const difference = this.reservationsService.getDaysDif(
          date[0],
          date[1],
        );
        const { cost } = this.reservationsService.calculateCost(
          difference,
          1000,
        );

        rentValues.push(
          `(${carId}, ${tariff}, '${date[0]}', '${date[1]}', ${cost})`,
        );
      }

      await this.databaseService.executeQuery(
        `INSERT INTO "RENT" (car_id, tariff_id, start_date, end_date, cost)
        VALUES ${rentValues}`,
      );
    }
  }
  async onModuleInit(): Promise<void> {
    await this.seed();
  }
}
