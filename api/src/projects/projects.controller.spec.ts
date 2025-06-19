import { Test, TestingModule } from '@nestjs/testing';
import { CreateProjectDto } from './dtos/create-project.dto';
import { ProjectIDDto } from './dtos/project-id.dto';
import { ProjectResponseDto } from './dtos/project-response.dto';
import { UpdateProjectDto } from './dtos/update-project.dto';
import { ProjectStatus } from './models/project.entity';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

// Mock the AuthGuard
jest.mock('../auth/auth.guard', () => ({
  AuthGuard: jest.fn().mockImplementation(() => ({
    canActivate: jest.fn().mockReturnValue(true),
  })),
}));

describe('ProjectsController', () => {
  let controller: ProjectsController;
  let projectsService: ProjectsService;

  const mockProjectsService = {
    createNewProject: jest.fn(),
    getProjectById: jest.fn(),
    getAllProjects: jest.fn(),
    updateProject: jest.fn(),
    deleteProject: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectsController],
      providers: [
        {
          provide: ProjectsService,
          useValue: mockProjectsService,
        },
      ],
    }).compile();

    controller = module.get<ProjectsController>(ProjectsController);
    projectsService = module.get<ProjectsService>(ProjectsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createProject', () => {
    it('should call projectsService.createNewProject with correct parameters', async () => {
      const createProjectDto: CreateProjectDto = {
        name: 'Test Project',
        details: 'Test Details',
        customerId: '1',
        userEmails: [],
        status: ProjectStatus.PLANNING,
        active: true,
      };

      const expectedResponse: ProjectResponseDto = {
        id: '1',
        name: 'Test Project',
        details: 'Test Details',
        active: true,
        status: ProjectStatus.PLANNING,
        users: [],
      };

      mockProjectsService.createNewProject.mockResolvedValue(expectedResponse);

      const result = await controller.createProject(createProjectDto);

      expect(projectsService.createNewProject).toHaveBeenCalledWith(createProjectDto);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('getProjectById', () => {
    it('should call projectsService.getProjectById with correct parameters', async () => {
      const params: ProjectIDDto = { id: '1' };

      const expectedResponse: ProjectResponseDto = {
        id: '1',
        name: 'Test Project',
        details: 'Test Details',
        active: true,
        status: ProjectStatus.PLANNING,
        users: [],
      };

      mockProjectsService.getProjectById.mockResolvedValue(expectedResponse);

      const result = await controller.getProjectById(params);

      expect(projectsService.getProjectById).toHaveBeenCalledWith(params.id);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('getAllProjects', () => {
    it('should call projectsService.getAllProjects', async () => {
      const expectedResponse: ProjectResponseDto[] = [
        {
          id: '1',
          name: 'Test Project 1',
          details: 'Test Details 1',
          active: true,
          status: ProjectStatus.PLANNING,
          users: [],
        },
        {
          id: '2',
          name: 'Test Project 2',
          details: 'Test Details 2',
          active: true,
          status: ProjectStatus.IN_PROGRESS,
          users: [],
        },
      ];

      mockProjectsService.getAllProjects.mockResolvedValue(expectedResponse);

      const result = await controller.getAllProjects();

      expect(projectsService.getAllProjects).toHaveBeenCalled();
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('updateProject', () => {
    it('should call projectsService.updateProject with correct parameters', async () => {
      const params: ProjectIDDto = { id: '1' };
      const updateProjectDto: UpdateProjectDto = {
        name: 'Updated Project',
        details: 'Updated Details',
        status: ProjectStatus.IN_PROGRESS,
      };

      const expectedResponse: ProjectResponseDto = {
        id: '1',
        name: 'Updated Project',
        details: 'Updated Details',
        active: true,
        status: ProjectStatus.IN_PROGRESS,
        users: [],
      };

      mockProjectsService.updateProject.mockResolvedValue(expectedResponse);

      const result = await controller.updateProject(params, updateProjectDto);

      expect(projectsService.updateProject).toHaveBeenCalledWith(params.id, updateProjectDto);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('deleteProject', () => {
    it('should call projectsService.deleteProject with correct parameters', async () => {
      const params: ProjectIDDto = { id: '1' };

      const expectedResponse: ProjectResponseDto = {
        id: '1',
        name: 'Test Project',
        details: 'Test Details',
        active: false,
        status: ProjectStatus.CANCELLED,
        users: [],
      };

      mockProjectsService.deleteProject.mockResolvedValue(expectedResponse);

      const result = await controller.deleteProject(params);

      expect(projectsService.deleteProject).toHaveBeenCalledWith(params.id);
      expect(result).toEqual(expectedResponse);
    });
  });
});
