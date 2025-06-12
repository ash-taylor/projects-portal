import { IsArray, IsBoolean, IsEmail, IsString } from 'class-validator';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn, Relation } from 'typeorm';
import { Role } from '../../auth/models/role.enum';
import { Project } from '../../projects/models/project.entity';

@Entity()
export class User {
  @IsString()
  @PrimaryColumn({ type: 'varchar', unique: true, nullable: false })
  sub: string;

  @IsString()
  @Column({ type: 'varchar', nullable: false })
  first_name: string;

  @IsString()
  @Column({ type: 'varchar', nullable: false })
  last_name: string;

  @IsArray()
  @Column({ type: 'enum', enum: Role, default: [Role.User], array: true, nullable: false })
  user_roles: Role[];

  @IsEmail()
  @Column({ type: 'varchar', unique: true, nullable: false })
  email: string;

  @IsBoolean()
  @Column({ type: 'boolean', nullable: false, default: true })
  active: boolean;

  @Column({ type: 'uuid', nullable: true })
  project_id: string | null;

  @ManyToOne(
    () => Project,
    (project) => project.users,
    { onDelete: 'SET NULL' },
  )
  @JoinColumn({ name: 'project_id' })
  project: Relation<Project>;
}
