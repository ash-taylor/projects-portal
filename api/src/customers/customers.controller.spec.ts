import { Test, TestingModule } from '@nestjs/testing';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dtos/create-customer.dto';
import { CustomerIDDto } from './dtos/customer-id.dto';
import { CustomerResponseDto } from './dtos/customer-response.dto';
import { UpdateCustomerDto } from './dtos/update-customer.dto';

// Mock the AuthGuard
jest.mock('../auth/auth.guard', () => ({
  AuthGuard: jest.fn().mockImplementation(() => ({
    canActivate: jest.fn().mockReturnValue(true),
  })),
}));

describe('CustomersController', () => {
  let controller: CustomersController;
  let customersService: CustomersService;

  const mockCustomersService = {
    createCustomer: jest.fn(),
    getCustomerById: jest.fn(),
    getAllCustomers: jest.fn(),
    updateCustomer: jest.fn(),
    deleteCustomer: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CustomersController],
      providers: [
        {
          provide: CustomersService,
          useValue: mockCustomersService,
        },
      ],
    }).compile();

    controller = module.get<CustomersController>(CustomersController);
    customersService = module.get<CustomersService>(CustomersService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createCustomer', () => {
    it('should call customersService.createCustomer with correct parameters', async () => {
      const createCustomerDto: CreateCustomerDto = {
        name: 'Test Customer',
        details: 'Test Details',
        active: true,
      };

      const expectedResponse: CustomerResponseDto = {
        id: '1',
        name: 'Test Customer',
        details: 'Test Details',
        active: true,
        projects: [],
      };

      mockCustomersService.createCustomer.mockResolvedValue(expectedResponse);

      const result = await controller.createCustomer(createCustomerDto);

      expect(customersService.createCustomer).toHaveBeenCalledWith(createCustomerDto);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('getCustomer', () => {
    it('should call customersService.getCustomerById with correct parameters', async () => {
      const params: CustomerIDDto = { id: '1' };

      const expectedResponse: CustomerResponseDto = {
        id: '1',
        name: 'Test Customer',
        details: 'Test Details',
        active: true,
        projects: [],
      };

      mockCustomersService.getCustomerById.mockResolvedValue(expectedResponse);

      const result = await controller.getCustomer(params);

      expect(customersService.getCustomerById).toHaveBeenCalledWith(params.id);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('getAllCustomers', () => {
    it('should call customersService.getAllCustomers', async () => {
      const expectedResponse: CustomerResponseDto[] = [
        {
          id: '1',
          name: 'Test Customer 1',
          details: 'Test Details 1',
          active: true,
          projects: [],
        },
        {
          id: '2',
          name: 'Test Customer 2',
          details: 'Test Details 2',
          active: true,
          projects: [],
        },
      ];

      mockCustomersService.getAllCustomers.mockResolvedValue(expectedResponse);

      const result = await controller.getAllCustomers();

      expect(customersService.getAllCustomers).toHaveBeenCalled();
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('updateCustomer', () => {
    it('should call customersService.updateCustomer with correct parameters', async () => {
      const params: CustomerIDDto = { id: '1' };
      const updateCustomerDto: UpdateCustomerDto = {
        name: 'Updated Customer',
        details: 'Updated Details',
      };

      const expectedResponse: CustomerResponseDto = {
        id: '1',
        name: 'Updated Customer',
        details: 'Updated Details',
        active: true,
        projects: [],
      };

      mockCustomersService.updateCustomer.mockResolvedValue(expectedResponse);

      const result = await controller.updateCustomer(params, updateCustomerDto);

      expect(customersService.updateCustomer).toHaveBeenCalledWith(params.id, updateCustomerDto);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('deleteCustomer', () => {
    it('should call customersService.deleteCustomer with correct parameters', async () => {
      const params: CustomerIDDto = { id: '1' };

      const expectedResponse: CustomerResponseDto = {
        id: '1',
        name: 'Test Customer',
        details: 'Test Details',
        active: false,
        projects: [],
      };

      mockCustomersService.deleteCustomer.mockResolvedValue(expectedResponse);

      const result = await controller.deleteCustomer(params);

      expect(customersService.deleteCustomer).toHaveBeenCalledWith(params.id);
      expect(result).toEqual(expectedResponse);
    });
  });
});