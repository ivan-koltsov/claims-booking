import { Injectable } from '@nestjs/common';
import { MatchRequestDto } from './dto/match-request.dto';
import { MatchResponseDto } from './dto/match-response.dto';
import { BookingDto } from './dto/booking.dto';
import { ClaimDto } from './dto/claim.dto';

// Мап для співставлення тестів між системами
const TESTS_MAP = [
  {
    bookingTestId: 'test_1',
    claimTestId: 'medical_service_1',
  },
  {
    bookingTestId: 'test_2',
    claimTestId: 'medical_service_2',
  },
];

interface MatchCandidate {
  booking: BookingDto;
  claim: ClaimDto;
  score: number;
  mismatches: string[];
}

@Injectable()
export class MatchingService {
  private testsMap: Map<string, string>;

  constructor() {
    // Створюємо Map для швидкого пошуку відповідності тестів
    this.testsMap = new Map(
      TESTS_MAP.map((item) => [item.bookingTestId, item.claimTestId]),
    );
  }

  matchBookingsWithClaims(matchRequestDto: MatchRequestDto): MatchResponseDto[] {
    const { bookings, claims } = matchRequestDto;
    const matches: MatchResponseDto[] = [];
    const usedClaims = new Set<string>();
    const usedBookings = new Set<string>();

    // Для кожного бронювання знаходимо найкращий claim
    for (const booking of bookings) {
      const candidates = this.findMatchCandidates(booking, claims, usedClaims);

      if (candidates.length > 0) {
        // Вибираємо кандидата з найвищим score
        candidates.sort((a, b) => b.score - a.score);
        const bestMatch = candidates[0];

        // Перевіряємо, чи не використовується вже цей claim іншим booking з вищим score
        if (!usedClaims.has(bestMatch.claim.id)) {
          usedClaims.add(bestMatch.claim.id);
          usedBookings.add(booking.id);

          const match: MatchResponseDto = {
            claim: bestMatch.claim.id,
            booking: booking.id,
          };

          if (bestMatch.mismatches.length > 0) {
            match.mismatch = bestMatch.mismatches;
          }

          matches.push(match);
        }
      }
    }

    // Другий прохід: для claims, які не були matched, шукаємо найкращі bookings
    for (const claim of claims) {
      if (!usedClaims.has(claim.id)) {
        const candidates = this.findMatchCandidatesForClaim(
          claim,
          bookings,
          usedBookings,
        );

        if (candidates.length > 0) {
          candidates.sort((a, b) => b.score - a.score);
          const bestMatch = candidates[0];

          if (!usedBookings.has(bestMatch.booking.id)) {
            usedClaims.add(claim.id);
            usedBookings.add(bestMatch.booking.id);

            const match: MatchResponseDto = {
              claim: claim.id,
              booking: bestMatch.booking.id,
            };

            if (bestMatch.mismatches.length > 0) {
              match.mismatch = bestMatch.mismatches;
            }

            matches.push(match);
          }
        }
      }
    }

    return matches;
  }

  private findMatchCandidates(
    booking: BookingDto,
    claims: ClaimDto[],
    usedClaims: Set<string>,
  ): MatchCandidate[] {
    const candidates: MatchCandidate[] = [];

    for (const claim of claims) {
      if (usedClaims.has(claim.id)) {
        continue;
      }

      const matchResult = this.calculateMatch(booking, claim);
      if (matchResult.score > 0) {
        candidates.push({
          booking,
          claim,
          score: matchResult.score,
          mismatches: matchResult.mismatches,
        });
      }
    }

    return candidates;
  }

  private findMatchCandidatesForClaim(
    claim: ClaimDto,
    bookings: BookingDto[],
    usedBookings: Set<string>,
  ): MatchCandidate[] {
    const candidates: MatchCandidate[] = [];

    for (const booking of bookings) {
      if (usedBookings.has(booking.id)) {
        continue;
      }

      const matchResult = this.calculateMatch(booking, claim);
      if (matchResult.score > 0) {
        candidates.push({
          booking,
          claim,
          score: matchResult.score,
          mismatches: matchResult.mismatches,
        });
      }
    }

    return candidates;
  }

  private calculateMatch(
    booking: BookingDto,
    claim: ClaimDto,
  ): { score: number; mismatches: string[] } {
    const mismatches: string[] = [];
    let score = 0;

    // Обов'язкові критерії
    // 1. Перевірка patient
    if (booking.patient !== claim.patient) {
      return { score: 0, mismatches: [] }; // Немає матчу
    }

    // 2. Перевірка дати (без часу)
    const bookingDate = new Date(booking.reservationDate);
    const claimDate = new Date(claim.bookingDate);

    if (!this.isSameDate(bookingDate, claimDate)) {
      return { score: 0, mismatches: [] }; // Немає матчу
    }

    // Якщо обов'язкові критерії пройшли, базовий score = 100
    score = 100;

    // Додаткові критерії для підвищення точності

    // 3. Перевірка точного часу (години та хвилини)
    if (this.isSameTime(bookingDate, claimDate)) {
      score += 30; // Додаємо бали за співпадіння часу
    } else {
      mismatches.push('time');
    }

    // 4. Перевірка test через testsMap
    const expectedClaimTestId = this.testsMap.get(booking.test);
    if (expectedClaimTestId === claim.medicalServiceCode) {
      score += 50; // Додаємо бали за співпадіння тесту
    } else {
      mismatches.push('test');
    }

    // 5. Перевірка страхової компанії
    if (booking.insurance === claim.insurance) {
      score += 20; // Додаємо бали за співпадіння страхової
    } else {
      mismatches.push('insurance');
    }

    return { score, mismatches };
  }

  private isSameDate(date1: Date, date2: Date): boolean {
    return (
      date1.getUTCFullYear() === date2.getUTCFullYear() &&
      date1.getUTCMonth() === date2.getUTCMonth() &&
      date1.getUTCDate() === date2.getUTCDate()
    );
  }

  private isSameTime(date1: Date, date2: Date): boolean {
    return (
      date1.getUTCHours() === date2.getUTCHours() &&
      date1.getUTCMinutes() === date2.getUTCMinutes()
    );
  }
}

