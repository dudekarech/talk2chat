import { IsString, IsOptional, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCompanyDto {
  @ApiProperty({
    description: 'Company name',
    example: 'Acme Corporation'
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Company domain (optional)',
    example: 'acme.com',
    required: false
  })
  @IsOptional()
  @IsString()
  domain?: string;

  @ApiProperty({
    description: 'Company logo URL (optional)',
    example: 'https://acme.com/logo.png',
    required: false
  })
  @IsOptional()
  @IsUrl()
  logo?: string;

  @ApiProperty({
    description: 'Company branding configuration (optional)',
    example: { primaryColor: '#007bff', secondaryColor: '#6c757d' },
    required: false
  })
  @IsOptional()
  branding?: Record<string, any>;
}
