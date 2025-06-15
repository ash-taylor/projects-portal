import { ConflictException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/models/user.entity';
import { CreateCustomerDto } from './dtos/create-customer.dto';
import { CustomerResponseDto } from './dtos/customer-response.dto';
import { UpdateCustomerDto } from './dtos/update-customer.dto';
import { Customer } from './models/customer.entity';

@Injectable()
export class CustomersService {
  private readonly log = new Logger(CustomersService.name);

  constructor(@InjectRepository(Customer) private readonly customersRepository: Repository<Customer>) {
    this.log.log('Initializing Customers Service...');
  }

  async createCustomer(customer: CreateCustomerDto): Promise<CustomerResponseDto> {
    try {
      this.log.log('Creating customer entity');

      if (await this.customersRepository.exists({ where: { name: customer.name } }))
        throw new ConflictException('Customer already exists');

      const { name, active, details } = customer;

      const newCustomer = this.customersRepository.create({ name, active, details });
      const savedCustomer = await this.customersRepository.save(newCustomer);

      return this._transformCustomerToDto(savedCustomer);
    } catch (error) {
      this.log.error(error);
      if (error instanceof ConflictException) throw error;
      throw new InternalServerErrorException();
    }
  }

  async getAllCustomers(): Promise<CustomerResponseDto[]> {
    try {
      this.log.log('Getting all customers');

      const customers = await this.customersRepository.find({ relations: ['projects', 'projects.users'] });

      return customers.map((customer) => this._transformCustomerToDto(customer));
    } catch (error) {
      this.log.error(error);
      throw new InternalServerErrorException();
    }
  }

  async getCustomerById(id: string): Promise<CustomerResponseDto> {
    try {
      this.log.log('Getting customer by id');
      const customer = await this.customersRepository.findOne({
        where: { id },
        relations: ['projects', 'projects.users'],
      });

      if (!customer) throw new NotFoundException('Customer not found');

      return this._transformCustomerToDto(customer);
    } catch (error) {
      this.log.error(error);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException();
    }
  }

  async updateCustomer(id: string, customer: UpdateCustomerDto) {
    try {
      this.log.log('Updating customer by id');

      const customerToUpdate = await this.customersRepository.findOneBy({ id });
      if (!customerToUpdate) throw new NotFoundException('Customer not found');

      const { name, active, details } = customer;

      customerToUpdate.name = name || customerToUpdate.name;
      customerToUpdate.active = active === undefined ? customerToUpdate.active : active;
      customerToUpdate.details = details || customerToUpdate.details;

      const updatedCustomer = await this.customersRepository.save(customerToUpdate);

      return this._transformCustomerToDto(updatedCustomer);
    } catch (error) {
      this.log.error(error);

      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException();
    }
  }

  async deleteCustomer(id: string) {
    try {
      this.log.log('Deleting customer by id');

      const customer = await this.customersRepository.findOneBy({ id });
      if (!customer) throw new NotFoundException('Customer not found');

      const deletedCustomer = await this.customersRepository.remove(customer);

      return this._transformCustomerToDto(deletedCustomer);
    } catch (error) {
      this.log.error(error);

      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException();
    }
  }

  private _transformCustomerToDto(customer: Customer): CustomerResponseDto {
    return {
      id: customer.id,
      name: customer.name,
      active: customer.active,
      details: customer.details,
      projects: customer.projects.map((project) => {
        return {
          id: project.id,
          name: project.name,
          active: project.active,
          status: project.status,
          details: project.details,
          users: project.users.map((user: User) => {
            return {
              firstName: user.first_name,
              lastName: user.last_name,
              email: user.email,
              userRoles: user.user_roles,
              active: user.active,
            };
          }),
        };
      }),
    };
  }
}
