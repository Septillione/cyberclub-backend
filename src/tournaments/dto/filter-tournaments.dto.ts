import { Discipline, TeamMode, TournamentStatus } from "@prisma/client";
import { Transform } from "class-transformer";
import { IsEnum, IsOptional, IsString } from "class-validator";

export enum SortOrder {
    NEWEST = 'NEWEST',
    OLDEST = 'OLDEST',
    POPULAR = 'POPULAR',
}

export class FitlerTournamentsDto {
    @IsOptional()
    @IsEnum(Discipline)
    discipline?: Discipline;

    @IsOptional()
    @IsEnum(TournamentStatus)
    status?: TournamentStatus;

    @IsOptional()
    @IsEnum(TeamMode)
    teamMode?: TeamMode;

    @IsOptional()
    @Transform(({ value }) => value === 'true')
    isOnline?: boolean;

    @IsOptional()
    @IsEnum(SortOrder)
    sortOrder?: SortOrder;

    @IsOptional()
    @IsString()
    search?: string;
}
