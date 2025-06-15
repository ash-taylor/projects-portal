import { Body, Controller, Delete, Get, Logger, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { Role } from '../auth/models/role.enum';
import { Roles } from '../auth/role.decorator';
import { CreateProjectDto } from './dtos/create-project.dto';
import { ProjectIDDto } from './dtos/project-id.dto';
import { ProjectResponseDto } from './dtos/project-response.dto';
import { UpdateProjectDto } from './dtos/update-project.dto';
import { ProjectsService } from './projects.service';

@Controller('projects')
export class ProjectsController {
  private readonly log = new Logger(ProjectsController.name);

  constructor(private readonly projectsService: ProjectsService) {
    this.log.log('Initializing Projects Controller...');
  }

  @Post()
  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  async createProject(@Body() dto: CreateProjectDto): Promise<ProjectResponseDto> {
    return await this.projectsService.createNewProject(dto);
  }

  @Get(':id')
  @Roles(Role.Admin, Role.User)
  @UseGuards(AuthGuard)
  async getProjectById(@Param() params: ProjectIDDto): Promise<ProjectResponseDto> {
    return await this.projectsService.getProjectById(params.id);
  }

  @Get()
  @Roles(Role.Admin, Role.User)
  @UseGuards(AuthGuard)
  async getAllProjects(): Promise<ProjectResponseDto[]> {
    return await this.projectsService.getAllProjects();
  }

  @Patch(':id')
  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  async updateProject(@Param() params: ProjectIDDto, @Body() dto: UpdateProjectDto): Promise<ProjectResponseDto> {
    return await this.projectsService.updateProject(params.id, dto);
  }

  @Delete(':id')
  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  async deleteProject(@Param() params: ProjectIDDto): Promise<ProjectResponseDto> {
    return await this.projectsService.deleteProject(params.id);
  }
}
