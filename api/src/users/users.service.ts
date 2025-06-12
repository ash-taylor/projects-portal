import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './models/user.entity';
import { IUser } from './models/user.interface';

@Injectable()
export class UsersService {
  private readonly log = new Logger(UsersService.name);
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {
    this.log.log('UsersService Initializing');
  }

  async createUser(user: IUser) {
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
      this.log.log('Saving user entity');
      return this.usersRepository.save(newUser);
    } catch (error) {
      this.log.error(error);
      throw new InternalServerErrorException();
    }
  }

  async verifyUser(email: string) {
    try {
      this.log.log('Updating user active status');
      const user = await this.usersRepository.findOneBy({ email });
      if (!user) throw new NotFoundException();
      user.active = true;
      return await this.usersRepository.save(user);
    } catch (error) {
      this.log.error(error);
      throw new InternalServerErrorException();
    }
  }

  async getUsers() {
    try {
      this.log.log('Getting all users');
      return await this.usersRepository.find();
    } catch (error) {
      this.log.error(error);
      throw new InternalServerErrorException();
    }
  }
}
