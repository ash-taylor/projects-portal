import { Controller, Get, Logger } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  private readonly log = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {
    this.log.log('Initializing Users Controller...');
  }

  @Get()
  async getUsers() {
    return await this.usersService.getUsers();
  }
}
