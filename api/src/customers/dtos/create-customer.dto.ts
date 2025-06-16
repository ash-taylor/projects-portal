import { IsBoolean, IsDefined, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  @MaxLength(50)
  @IsNotEmpty()
  @IsDefined()
  name!: string;

  @IsBoolean()
  @IsOptional()
  active = true;

  @IsString()
  @IsOptional()
  @MaxLength(60)
  details?: string;
}
