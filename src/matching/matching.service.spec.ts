import { Test, TestingModule } from '@nestjs/testing';
import { MatchingService } from './matching.service';
import { MatchRequestDto } from './dto/match-request.dto';

describe('MatchingService', () => {
  let service: MatchingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MatchingService],
    }).compile();

    service = module.get<MatchingService>(MatchingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('matchBookingsWithClaims', () => {
    it('should match booking with claim when all criteria match', () => {
      const request: MatchRequestDto = {
        bookings: [
          {
            id: 'booking_1',
            patient: 'patient_1',
            test: 'test_1',
            insurance: 'AON',
            reservationDate: '2025-05-15T10:30:00.000Z',
          },
        ],
        claims: [
          {
            id: 'claim_1',
            medicalServiceCode: 'medical_service_1',
            bookingDate: '2025-05-15T10:30:00.000Z',
            insurance: 'AON',
            patient: 'patient_1',
          },
        ],
      };

      const result = service.matchBookingsWithClaims(request);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        claim: 'claim_1',
        booking: 'booking_1',
      });
    });

    it('should include mismatch field when some criteria do not match', () => {
      const request: MatchRequestDto = {
        bookings: [
          {
            id: 'booking_1',
            patient: 'patient_1',
            test: 'test_1',
            insurance: 'AON',
            reservationDate: '2025-05-16T11:00:00.000Z',
          },
        ],
        claims: [
          {
            id: 'claim_1',
            medicalServiceCode: 'medical_service_1',
            bookingDate: '2025-05-16T10:33:00.000Z',
            insurance: 'AON',
            patient: 'patient_1',
          },
        ],
      };

      const result = service.matchBookingsWithClaims(request);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        claim: 'claim_1',
        booking: 'booking_1',
        mismatch: ['time'],
      });
    });

    it('should not match when patient is different', () => {
      const request: MatchRequestDto = {
        bookings: [
          {
            id: 'booking_1',
            patient: 'patient_1',
            test: 'test_1',
            insurance: 'AON',
            reservationDate: '2025-05-15T10:30:00.000Z',
          },
        ],
        claims: [
          {
            id: 'claim_1',
            medicalServiceCode: 'medical_service_1',
            bookingDate: '2025-05-15T10:30:00.000Z',
            insurance: 'AON',
            patient: 'patient_2',
          },
        ],
      };

      const result = service.matchBookingsWithClaims(request);

      expect(result).toHaveLength(0);
    });

    it('should not match when date is different', () => {
      const request: MatchRequestDto = {
        bookings: [
          {
            id: 'booking_1',
            patient: 'patient_1',
            test: 'test_1',
            insurance: 'AON',
            reservationDate: '2025-05-15T10:30:00.000Z',
          },
        ],
        claims: [
          {
            id: 'claim_1',
            medicalServiceCode: 'medical_service_1',
            bookingDate: '2025-05-16T10:30:00.000Z',
            insurance: 'AON',
            patient: 'patient_1',
          },
        ],
      };

      const result = service.matchBookingsWithClaims(request);

      expect(result).toHaveLength(0);
    });

    it('should select best match when multiple claims are available', () => {
      const request: MatchRequestDto = {
        bookings: [
          {
            id: 'booking_1',
            patient: 'patient_1',
            test: 'test_1',
            insurance: 'AON',
            reservationDate: '2025-05-15T10:30:00.000Z',
          },
        ],
        claims: [
          {
            id: 'claim_1',
            medicalServiceCode: 'medical_service_1',
            bookingDate: '2025-05-15T10:30:00.000Z',
            insurance: 'FASCHIM',
            patient: 'patient_1',
          },
          {
            id: 'claim_2',
            medicalServiceCode: 'medical_service_1',
            bookingDate: '2025-05-15T10:30:00.000Z',
            insurance: 'AON',
            patient: 'patient_1',
          },
        ],
      };

      const result = service.matchBookingsWithClaims(request);

      expect(result).toHaveLength(1);
      expect(result[0].claim).toBe('claim_2'); // Should choose claim_2 because insurance matches
    });

    it('should handle example from requirements', () => {
      const request: MatchRequestDto = {
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
      };

      const result = service.matchBookingsWithClaims(request);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        claim: 'claim_10',
        booking: 'booking_9',
        mismatch: ['time', 'test'],
      });
    });
  });
});

