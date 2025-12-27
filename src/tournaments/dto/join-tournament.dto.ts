import { IsOptional, IsString } from "class-validator";

export class JoinTournamentDto {
    @IsOptional()
    @IsString()
    teamId?: string;
}