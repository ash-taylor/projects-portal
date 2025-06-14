import { IsBoolean, IsDefined, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  @MaxLength(40)
  @IsNotEmpty()
  @IsDefined()
  name!: string;

  @IsBoolean()
  @IsOptional()
  active = true;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  details?: string;
}
