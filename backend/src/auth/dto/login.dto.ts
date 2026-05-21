import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

// Data Transfer Object (DTO) defining the schema and validation rules for admin login requests
export class LoginDto {
  @ApiProperty({ example: 'admin@glamcut.local' }) // Swagger decorator defining schema example for API documentation
  @IsEmail() // Validation decorator ensuring the field is a valid email address structure
  email!: string;

  @ApiProperty({ example: 'change-me', minLength: 1 }) // Swagger decorator showing minimum length constraints
  @IsString() // Validation decorator ensuring the field is passed as a string
  @MinLength(1) // Validation decorator ensuring the password is at least 1 character long (not empty)
  password!: string;
}

