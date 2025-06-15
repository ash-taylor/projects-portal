import { ConflictException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomersService } from '../customers/customers.service';
import { CreateProjectDto } from './dtos/create-project.dto';
import { ProjectResponseDto } from './dtos/project-response.dto';
import { UpdateProjectDto } from './dtos/update-project.dto';
import { Project } from './models/project.entity';

@Injectable()
export class ProjectsService {
  private readonly log = new Logger(ProjectsService.name);

  constructor(
    @InjectRepository(Project) private readonly projectsRepository: Repository<Project>,
    private readonly customersService: CustomersService,
  ) {
    this.log.log('Initializing Projects Service...');
  }

  async createNewProject(project: CreateProjectDto): Promise<ProjectResponseDto> {
    try {
      this.log.log('Creating new project');

      const { name, active, status, details, customerId } = project;

      if (await this.projectsRepository.exists({ where: { name } }))
        throw new ConflictException('Project already exists');

      const customer = await this.customersService.getCustomerById(customerId);
      const newProject = this.projectsRepository.create({ name, active, status, details, customer });

      const savedProject = await this.projectsRepository.save(newProject);

      return this._transformProjectToDto(savedProject);
    } catch (error) {
      this.log.error(error);
      if (error instanceof ConflictException) throw error;
      throw new InternalServerErrorException();
    }
  }

  async getProjectById(id: string): Promise<ProjectResponseDto> {
    try {
      this.log.log('Getting project by id');

      const project = await this.projectsRepository.findOne({ where: { id }, relations: ['customer', 'users'] });
      if (!project) throw new NotFoundException('Project not found');

      return this._transformProjectToDto(project);
    } catch (error) {
      this.log.error(error);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException();
    }
  }

  async getAllProjects(): Promise<ProjectResponseDto[]> {
    try {
      this.log.log('Getting all projects');

      const projects = await this.projectsRepository.find({ relations: ['customer', 'users'] });

      return projects.map((project) => this._transformProjectToDto(project));
    } catch (error) {
      this.log.error(error);
      throw new InternalServerErrorException();
    }
  }

  async updateProject(id: string, project: UpdateProjectDto) {
    try {
      this.log.log('Updating project by id');

      const projectToUpdate = await this.projectsRepository.findOneBy({ id });
      if (!projectToUpdate) throw new NotFoundException('Project not found');

      const { name, active, status, details } = project;

      projectToUpdate.name = name || projectToUpdate.name;
      projectToUpdate.active = active === undefined ? projectToUpdate.active : active;
      projectToUpdate.status = status || projectToUpdate.status;
      projectToUpdate.details = details || projectToUpdate.details;

      const updatedProject = await this.projectsRepository.save(projectToUpdate);

      return this._transformProjectToDto(updatedProject);
    } catch (error) {
      this.log.error(error);

      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException();
    }
  }

  async deleteProject(id: string) {
    try {
      this.log.log('Deleting project by id');

      const project = await this.projectsRepository.findOneBy({ id });
      if (!project) throw new NotFoundException('Project not found');

      const deletedProject = await this.projectsRepository.remove(project);

      return this._transformProjectToDto(deletedProject);
    } catch (error) {
      this.log.error(error);

      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException();
    }
  }

  private _transformProjectToDto(project: Project): ProjectResponseDto {
    return {
      id: project.id,
      name: project.name,
      active: project.active,
      status: project.status,
      details: project.details,
      customer: {
        id: project.customer.id,
        name: project.customer.name,
        active: project.customer.active,
        details: project.customer.details,
      },
      users: project.users.map((user) => {
        return {
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          userRoles: user.user_roles,
          active: user.active,
        };
      }),
    };
  }
}
