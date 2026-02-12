import { IsInt, IsOptional, IsString, IsUUID, Min } from "class-validator";

export class CreateBanUserDto {
    @IsUUID()
    userId: string;

    @IsOptional()
    @IsString()
    reason: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    days?: number;
}

export class CreateBanTeamDto {
    @IsUUID()
    teamId: string;

    @IsOptional()
    @IsString()
    reason: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    days?: number;
}