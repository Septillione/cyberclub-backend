import { Discipline, TeamMode, TournamentStatus } from "@prisma/client";
import { IsEnum, IsOptional, IsString } from "class-validator";

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
    @IsString()
    search?: string;
}
