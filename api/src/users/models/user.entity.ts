import { IsArray, IsBoolean, IsEmail, IsString } from 'class-validator';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn, Relation } from 'typeorm';
import { Role } from '../../auth/models/role.enum';
import { Project } from '../../projects/models/project.entity';

@Entity()
export class User {
  @IsString()
  @PrimaryColumn({ type: 'varchar', length: 50, unique: true, nullable: false })
  sub: string;

  @IsString()
  @Column({ type: 'varchar', length: 30, nullable: false })
  first_name: string;

  @IsString()
  @Column({ type: 'varchar', length: 30, nullable: false })
  last_name: string;

  @IsArray()
  @Column({ type: 'enum', enum: Role, array: true, nullable: false })
  user_roles: Role[];

  @IsEmail()
  @Column({ type: 'varchar', length: 30, unique: true, nullable: false })
  email: string;

  @IsBoolean()
  @Column({ type: 'boolean', nullable: false, default: true })
  active: boolean;

  @ManyToOne(
    () => Project,
    (project) => project.users,
    { onDelete: 'SET NULL' },
  )
  @JoinColumn({ name: 'project_id' })
  project: Relation<Project>;
}
