import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateCustomerDto {
  @IsString()
  @MaxLength(50)
  @IsOptional()
  name?: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @IsString()
  @MaxLength(60)
  @IsOptional()
  details?: string;
}
