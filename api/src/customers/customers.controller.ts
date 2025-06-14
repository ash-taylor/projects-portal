import { Body, Controller, Delete, Get, Logger, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { Role } from '../auth/models/role.enum';
import { Roles } from '../auth/role.decorator';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dtos/create-customer.dto';
import { CustomerIDDto } from './dtos/customer-id.dto';
import { CustomerResponseDto } from './dtos/customer-response.dto';
import { UpdateCustomerDto } from './dtos/update-customer.dto';

@Controller('customers')
export class CustomersController {
  private readonly log = new Logger(CustomersController.name);

  constructor(private readonly customersService: CustomersService) {
    this.log.log('Initializing Customers Controller...');
  }

  @Post()
  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  async createCustomer(@Body() dto: CreateCustomerDto): Promise<CustomerResponseDto> {
    return await this.customersService.createCustomer(dto);
  }

  @Get(':id')
  @Roles(Role.Admin, Role.User)
  @UseGuards(AuthGuard)
  async getCustomer(@Param() params: CustomerIDDto): Promise<CustomerResponseDto> {
    return await this.customersService.getCustomerById(params.id);
  }

  @Get()
  @Roles(Role.Admin, Role.User)
  @UseGuards(AuthGuard)
  async getAllCustomers(): Promise<CustomerResponseDto[]> {
    return await this.customersService.getAllCustomers();
  }

  @Patch(':id')
  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  async updateCustomer(@Param() params: CustomerIDDto, @Body() dto: UpdateCustomerDto): Promise<CustomerResponseDto> {
    return await this.customersService.updateCustomer(params.id, dto);
  }

  @Delete(':id')
  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  async deleteCustomer(@Param() params: CustomerIDDto): Promise<CustomerResponseDto> {
    return await this.customersService.deleteCustomer(params.id);
  }
}
