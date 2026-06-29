import { Type } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

export class UpdateUserInput {
  @ValidateIf((_, value) => value !== undefined)
  @IsEmail()
  @IsNotEmpty({ message: "can't be blank" })
  email?: string;

  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @IsNotEmpty({ message: "can't be blank" })
  username?: string;

  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @IsNotEmpty({ message: "can't be blank" })
  @MinLength(8)
  password?: string;

  @IsOptional()
  @IsString()
  bio?: string | null;

  @IsOptional()
  @IsString()
  image?: string | null;
}

export class UpdateUserDto {
  @ValidateNested()
  @Type(() => UpdateUserInput)
  user!: UpdateUserInput;
}
