import { IsBoolean, IsDateString, IsEnum, IsInt, IsOptional, IsString, isValidationOptions, ValidateNested } from "class-validator";
import { BracketType, Discipline, TeamMode } from "@prisma/client";
import { Type } from "class-transformer";

class PrizeItemDto {
    @IsString()
    label: string;

    @IsString()
    amount: string;
}

export class CreateTournamentDto {
    @IsString()
    title: string;

    @IsString()
    description: string;

    @IsString()
    rules: string;

    @IsEnum(Discipline)
    discipline: Discipline;

    @IsString()
    imageUrl: string;

    @IsDateString()
    startDate: string;

    @IsInt()
    maxParticipants: number;

    @IsEnum(BracketType)
    bracketType: BracketType;

    @IsEnum(TeamMode)
    teamMode: TeamMode;

    @IsOptional()
    @IsString()
    prizePoolString?: string;

    @IsOptional()
    @IsBoolean()
    isOnline?: boolean;

    @IsOptional()
    @IsString()
    address?: string;

    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => PrizeItemDto)
    prizes?: PrizeItemDto[];
}
