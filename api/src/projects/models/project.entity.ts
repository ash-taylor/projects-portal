import { IsArray, IsBoolean, IsEnum, IsString } from 'class-validator';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn, Relation } from 'typeorm';
import { User } from '../../users/models/user.entity';

export enum ProjectStatus {
  PLANNING = 'planning',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  ON_HOLD = 'on_hold',
  CANCELLED = 'cancelled',
}

@Entity()
export class Project {
  @IsString()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @IsString()
  @Column({ type: 'varchar', length: 50, unique: true, nullable: false })
  name: string;

  @IsBoolean()
  @Column({ type: 'boolean', default: true, nullable: false })
  active: boolean;

  @IsEnum(ProjectStatus)
  @Column({ type: 'enum', enum: ProjectStatus, nullable: false })
  status: ProjectStatus;

  @IsArray()
  @Column({ type: 'text', nullable: true })
  details: string | null;

  @OneToMany(
    () => User,
    (user) => user.project,
  )
  users: Relation<User>[];
}
