import { IsArray, IsOptional, IsString, IsUUID } from "class-validator";

export class JoinTournamentDto {
    @IsOptional()
    @IsString()
    teamId?: string;

    @IsOptional()
    @IsArray()
    @IsUUID('4', { each: true })
    rosterIds?: string[];
}