import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  UseGuards, 
  Request,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('companies')
@Controller('companies')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  @Roles(UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Create a new company (superadmin only)' })
  @ApiResponse({ status: 201, description: 'Company created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires superadmin role' })
  create(@Body() createCompanyDto: CreateCompanyDto, @Request() req) {
    return this.companiesService.createCompany(createCompanyDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all companies (filtered by user role)' })
  @ApiResponse({ status: 200, description: 'Companies retrieved successfully' })
  findAll(@Request() req) {
    return this.companiesService.findAll(req.user.id, req.user.role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get company by ID' })
  @ApiResponse({ status: 200, description: 'Company retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - access denied to this company' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.companiesService.findOne(id, req.user.id, req.user.role);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update company' })
  @ApiResponse({ status: 200, description: 'Company updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - access denied to this company' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  update(@Param('id') id: string, @Body() updateCompanyDto: UpdateCompanyDto, @Request() req) {
    return this.companiesService.updateCompany(id, updateCompanyDto, req.user.id, req.user.role);
  }

  @Post(':id/approve')
  @Roles(UserRole.SUPERADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve company (superadmin only)' })
  @ApiResponse({ status: 200, description: 'Company approved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires superadmin role' })
  approveCompany(@Param('id') id: string, @Request() req) {
    return this.companiesService.approveCompany(id, req.user.id);
  }

  @Post(':id/suspend')
  @Roles(UserRole.SUPERADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Suspend company (superadmin only)' })
  @ApiResponse({ status: 200, description: 'Company suspended successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires superadmin role' })
  suspendCompany(@Param('id') id: string, @Request() req) {
    return this.companiesService.suspendCompany(id, req.user.id);
  }

  @Get(':id/widget')
  @ApiOperation({ summary: 'Get widget embed code for company' })
  @ApiResponse({ status: 200, description: 'Widget embed code retrieved' })
  @ApiResponse({ status: 403, description: 'Forbidden - access denied to this company' })
  getWidgetEmbedCode(@Param('id') id: string, @Request() req) {
    return this.companiesService.getWidgetEmbedCode(id, req.user.id, req.user.role);
  }

  @Delete(':id')
  @Roles(UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Delete company (superadmin only)' })
  @ApiResponse({ status: 200, description: 'Company deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires superadmin role' })
  remove(@Param('id') id: string) {
    // TODO: Implement soft delete or hard delete based on requirements
    return { message: 'Delete endpoint not implemented yet' };
  }
}
