import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateUserDto } from '../auth/dtos/update-user.dto';
import { UserResponseDto } from './dtos/user-response.dto';
import { User } from './models/user.entity';
import { IUser } from './models/user.interface';

@Injectable()
export class UsersService {
  private readonly log = new Logger(UsersService.name);
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {
    this.log.log('UsersService Initializing');
  }

  async createUser(user: IUser): Promise<UserResponseDto> {
    try {
      this.log.log('Creating user entity');

      const { sub, firstName, lastName, email, roles, active } = user;

      const newUser = this.usersRepository.create({
        sub,
        first_name: firstName,
        last_name: lastName,
        email,
        user_roles: roles,
        active,
      });

      // Auth provider (Cognito) will be single source of truth for users
      if (await this.usersRepository.exists({ where: [{ email }, { sub }] })) {
        await this.usersRepository.delete([{ email }, { sub }]);
      }

      this.log.log('Saving user entity');
      const savedUser = await this.usersRepository.save(newUser);

      return this._transformUserToDto(savedUser);
    } catch (error) {
      this.log.error(error);
      throw new InternalServerErrorException();
    }
  }

  async verifyUser(email: string): Promise<UserResponseDto> {
    try {
      this.log.log('Updating user active status');

      const user = await this.usersRepository.findOneBy({ email });
      if (!user) throw new NotFoundException();

      user.active = true;

      const updatedUser = await this.usersRepository.save(user);

      return this._transformUserToDto(updatedUser);
    } catch (error) {
      this.log.error(error);
      throw new InternalServerErrorException();
    }
  }

  async getUser(identifier: string): Promise<UserResponseDto> {
    try {
      this.log.log('Getting user by email');

      const user = await this.usersRepository.findOne({
        where: [{ email: identifier }, { sub: identifier }],
        relations: ['project', 'project.customer'],
      });
      if (!user) throw new NotFoundException();

      return this._transformUserToDto(user);
    } catch (error) {
      this.log.error(error);
      if (error instanceof NotFoundException) throw new NotFoundException();
      throw new InternalServerErrorException();
    }
  }

  async getUserDBEntity(identifier: string): Promise<User> {
    try {
      this.log.log('Getting user DB entity by email');

      const user = await this.usersRepository.findOne({
        where: [{ email: identifier }, { sub: identifier }],
        relations: ['project', 'project.customer'],
      });
      if (!user) throw new NotFoundException();

      return user;
    } catch (error) {
      this.log.error(error);
      if (error instanceof NotFoundException) throw new NotFoundException();
      throw new InternalServerErrorException();
    }
  }

  async getAllUsers(): Promise<UserResponseDto[]> {
    try {
      this.log.log('Getting all users');

      const users = await this.usersRepository.find({ relations: ['project', 'project.customer'] });

      return users.map((user) => this._transformUserToDto(user));
    } catch (error) {
      this.log.error(error);
      throw new InternalServerErrorException();
    }
  }

  async updateUser(user: UpdateUserDto, identifier: string) {
    this.log.log('Updating user in database');

    const { firstName, lastName, email, project } = user;

    const newUser: { [key: string]: string | null } = {};

    if (firstName) newUser.first_name = firstName;
    if (lastName) newUser.last_name = lastName;
    if (project !== undefined) newUser.project = project;
    if (email) newUser.email = email;

    const userToUpdate = await this.usersRepository.findOne({
      where: [{ sub: identifier }, { email: identifier }],
      relations: ['project', 'project.customer'],
    });

    if (!userToUpdate) throw new NotFoundException('User not found');

    await this.usersRepository.save({
      ...userToUpdate,
      ...newUser,
    });

    return await this.getUser(identifier);
  }

  async deleteUser(identifier: string): Promise<UserResponseDto> {
    this.log.log('Deleting user from database');

    const user = await this.usersRepository.findOneBy([{ sub: identifier }, { email: identifier }]);
    if (!user) throw new NotFoundException();

    return this._transformUserToDto(await this.usersRepository.remove(user));
  }

  private _transformUserToDto(user: User): UserResponseDto {
    return {
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      userRoles: user.user_roles,
      active: user.active,
      project: user.project
        ? {
            id: user.project.id,
            name: user.project.name,
            active: user.project.active,
            status: user.project.status,
            details: user.project.details,
            users:
              user.project.users &&
              user.project.users.map((user: User) => {
                return {
                  firstName: user.first_name,
                  lastName: user.last_name,
                  email: user.email,
                  userRoles: user.user_roles,
                  active: user.active,
                };
              }),
            customer: {
              id: user.project.customer.id,
              name: user.project.customer.name,
              active: user.project.customer.active,
              details: user.project.customer.details,
            },
          }
        : undefined,
    };
  }
}
