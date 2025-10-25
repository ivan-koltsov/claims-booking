import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('MatchingController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/match (POST) - should match bookings with claims', () => {
    return request(app.getHttpServer())
      .post('/match')
      .send({
        bookings: [
          {
            id: 'booking_1',
            patient: 'patient_1',
            test: 'test_1',
            insurance: 'AON',
            reservationDate: '2025-05-16T11:00:00.000Z',
          },
          {
            id: 'booking_7',
            patient: 'patient_7',
            test: 'test_1',
            insurance: 'AON',
            reservationDate: '2025-05-15T10:30:00.000Z',
          },
          {
            id: 'booking_9',
            patient: 'patient_8',
            test: 'test_1',
            insurance: 'FASCHIM',
            reservationDate: '2025-05-15T10:30:00.000Z',
          },
        ],
        claims: [
          {
            id: 'claim_1',
            medicalServiceCode: 'medical_service_1',
            bookingDate: '2025-05-15T10:33:00.000Z',
            insurance: 'AON',
            patient: 'patient_1',
          },
          {
            id: 'claim_9',
            medicalServiceCode: 'medical_service_2',
            bookingDate: '2025-05-15T10:31:00.000Z',
            insurance: 'AON',
            patient: 'patient_8',
          },
          {
            id: 'claim_10',
            medicalServiceCode: 'medical_service_2',
            bookingDate: '2025-05-15T00:00:00.000Z',
            insurance: 'FASCHIM',
            patient: 'patient_8',
          },
        ],
      })
      .expect(201)
      .expect([
        {
          claim: 'claim_10',
          booking: 'booking_9',
          mismatch: ['time', 'test'],
        },
      ]);
  });

  it('/match (POST) - should validate request body', () => {
    return request(app.getHttpServer())
      .post('/match')
      .send({
        bookings: [
          {
            id: 'booking_1',
            // missing required fields
          },
        ],
        claims: [],
      })
      .expect(400);
  });
});

