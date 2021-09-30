import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseService } from '../database/database.service';
import { ReservationsService } from './reservations.service';

describe('ReservationsService', () => {
  let service: ReservationsService;
  const mockRepository = {
    executeQuery() {
      return [
        {
          id: 1,
          brand: 'Land Rover',
          model: 'F-150',
          licence_plate: 'K958MM',
        },
      ];
    },
  };
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationsService,
        { provide: DatabaseService, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<ReservationsService>(ReservationsService);
  });

  describe('getDaysDif', () => {
    it('should correctly calculate DaysDif', async () => {
      const item1 = {
        start: '2021-01-01',
        end: '2021-01-02',
      };

      const item2 = {
        start: '2021-07-30',
        end: '2021-08-05',
      };

      const item3 = {
        start: '2021-02-10',
        end: '2021-02-20',
      };

      const desiredResult1 = 2;
      const result1 = service.getDaysDif(item1.start, item1.end);

      expect(result1).toEqual(desiredResult1);

      const desiredResult2 = 7;
      const result2 = service.getDaysDif(item2.start, item2.end);

      expect(result2).toEqual(desiredResult2);

      const desiredResult3 = 11;
      const result3 = service.getDaysDif(item3.start, item3.end);

      expect(result3).toEqual(desiredResult3);
    });
  });

  describe('calculateCost', () => {
    it('should correctly calculate cost', async () => {
      const item1 = {
        days: 3,
        price: 1000,
      };

      const item2 = {
        days: 11,
        price: 1000,
      };

      const item3 = {
        days: 18,
        price: 1000,
      };

      const desiredResult1 = { cost: 2850, discount: '5%' };
      const result1 = service.calculateCost(item1.days, item1.price);

      expect(result1).toEqual(desiredResult1);

      const desiredResult2 = { cost: 9900, discount: '10%' };
      const result2 = service.calculateCost(item2.days, item2.price);

      expect(result2).toEqual(desiredResult2);

      const desiredResult3 = { cost: 15300, discount: '15%' };
      const result3 = service.calculateCost(item3.days, item3.price);

      expect(result3).toEqual(desiredResult3);
    });
  });

  describe('checkCarsAvailability', () => {
    it('should return the rent object', async () => {
      const item1 = {
        startDate: '2021-01-01',
        endDate: '2021-02-01',
        licence_plate: 'K958MM',
      };
      const expectedResult = [
        {
          id: 1,
          brand: 'Land Rover',
          model: 'F-150',
          licence_plate: 'K958MM',
        },
      ];

      const { data } = await service.checkCarsAvailability(item1);
      expect(data).toEqual(expectedResult);
    });
  });
});
