import { IsArray, IsOptional, IsString } from "class-validator"

export class UpdateTeamDto {
    @IsOptional()
    @IsString()
    name?: string

    @IsOptional()
    @IsString()
    tag?: string

    @IsOptional()
    @IsString()
    avatarUrl?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    socialMedia?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    gamesList?: string[];
}
