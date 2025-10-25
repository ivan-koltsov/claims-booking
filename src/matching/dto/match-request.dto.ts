import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { BookingDto } from './booking.dto';
import { ClaimDto } from './claim.dto';

export class MatchRequestDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BookingDto)
  bookings: BookingDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ClaimDto)
  claims: ClaimDto[];
}

