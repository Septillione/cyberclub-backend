import { IsArray, IsOptional, IsString, IsUrl, MaxLength, MinLength } from "class-validator";

export class CreateTeamDto {
    @IsString()
    @MinLength(3)
    @MaxLength(30)
    name: string;

    @IsString()
    @MinLength(2)
    @MaxLength(5)
    tag: string;

    @IsOptional()
    @IsString()
    @MaxLength(300)
    description?: string;

    @IsOptional()
    @IsString()
    @MaxLength(50)
    socialMedia?: string;

    @IsOptional()
    @IsArray()
    gamesList?: string[];

    @IsOptional()
    @IsUrl()
    avatarUrl?: string;
}