import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '../auth/models/role.enum';
import { UserEmailDto } from './dtos/user-email.dto';
import { UserResponseDto } from './dtos/user-response.dto';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

jest.mock('../auth/auth.guard', () => ({
  AuthGuard: jest.fn().mockImplementation(() => ({
    canActivate: jest.fn().mockReturnValue(true),
  })),
}));

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: UsersService;

  const mockUsersService = {
    getUser: jest.fn(),
    getAllUsers: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getUsers', () => {
    it('should return a single user when email is provided', async () => {
      const userEmailDto: UserEmailDto = {
        email: 'test@example.com',
      };

      const expectedResponse: UserResponseDto = {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        userRoles: [Role.User],
        active: true,
      };

      mockUsersService.getUser.mockResolvedValue(expectedResponse);

      const result = await controller.getUsers(userEmailDto);

      expect(usersService.getUser).toHaveBeenCalledWith(userEmailDto.email);
      expect(result).toEqual(expectedResponse);
    });

    it('should return all users when no email is provided', async () => {
      const expectedResponse: UserResponseDto[] = [
        {
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          userRoles: [Role.User],
          active: true,
        },
        {
          firstName: 'Admin',
          lastName: 'User',
          email: 'admin@example.com',
          userRoles: [Role.Admin],
          active: true,
        },
      ];

      mockUsersService.getAllUsers.mockResolvedValue(expectedResponse);

      const result = await controller.getUsers();

      expect(usersService.getAllUsers).toHaveBeenCalled();
      expect(result).toEqual(expectedResponse);
    });

    it('should return all users when empty query params are provided', async () => {
      const emptyQueryParams: UserEmailDto = {};

      const expectedResponse: UserResponseDto[] = [
        {
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          userRoles: [Role.User],
          active: true,
        },
        {
          firstName: 'Admin',
          lastName: 'User',
          email: 'admin@example.com',
          userRoles: [Role.Admin],
          active: true,
        },
      ];

      mockUsersService.getAllUsers.mockResolvedValue(expectedResponse);

      const result = await controller.getUsers(emptyQueryParams);

      expect(usersService.getAllUsers).toHaveBeenCalled();
      expect(result).toEqual(expectedResponse);
    });
  });
});
