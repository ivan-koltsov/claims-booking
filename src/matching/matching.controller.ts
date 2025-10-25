import { Controller, Post, Body } from '@nestjs/common';
import { MatchingService } from './matching.service';
import { MatchRequestDto } from './dto/match-request.dto';
import { MatchResponseDto } from './dto/match-response.dto';

@Controller('match')
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  @Post()
  match(@Body() matchRequestDto: MatchRequestDto): MatchResponseDto[] {
    return this.matchingService.matchBookingsWithClaims(matchRequestDto);
  }
}

