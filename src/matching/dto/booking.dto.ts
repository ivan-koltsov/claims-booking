import { IsString, IsDateString, IsNotEmpty } from 'class-validator';

export class BookingDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  patient: string;

  @IsString()
  @IsNotEmpty()
  test: string;

  @IsString()
  @IsNotEmpty()
  insurance: string;

  @IsDateString()
  @IsNotEmpty()
  reservationDate: string;
}

