import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateCustomerDto {
  @IsString()
  @MaxLength(40)
  @IsOptional()
  name?: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @IsString()
  @MaxLength(255)
  @IsOptional()
  details?: string;
}
