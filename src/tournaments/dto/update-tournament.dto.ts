import { IsBoolean, IsDateString, IsEnum, IsInt, IsOptional, IsString, isValidationOptions, ValidateNested } from "class-validator";
import { BracketType, Discipline, TeamMode } from "@prisma/client";
import { Type } from "class-transformer";

class PrizeItemDto {
    @IsOptional()
    @IsString()
    label?: string;

    @IsOptional()
    @IsString()
    amount?: string;
}

export class UpdateTournamentDto {
    @IsOptional()
    @IsString()
    title?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    rules?: string;

    @IsOptional()
    @IsEnum(Discipline)
    discipline?: Discipline;

    @IsOptional()
    @IsString()
    imageUrl?: string;

    @IsOptional()
    @IsDateString()
    startDate?: string;

    @IsOptional()
    @IsInt()
    maxParticipants?: number;

    @IsOptional()
    @IsEnum(BracketType)
    bracketType?: BracketType;

    @IsOptional()
    @IsEnum(TeamMode)
    teamMode?: TeamMode;

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
