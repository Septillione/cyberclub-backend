import { IsArray, IsOptional, IsString } from "class-validator";

export class JoinTournamentDto {
    @IsOptional()
    @IsString()
    teamId?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    rosterIds?: string[];
}