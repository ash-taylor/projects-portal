import { IsBoolean, IsString } from 'class-validator';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn, Relation } from 'typeorm';
import { Project } from '../../projects/models/project.entity';

@Entity('customer')
export class Customer {
  @IsString()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @IsString()
  @Column({ type: 'varchar', length: 50, unique: true, nullable: false })
  name: string;

  @IsBoolean()
  @Column({ type: 'boolean', default: true, nullable: false })
  active: boolean;

  @IsString()
  @Column({ type: 'text', nullable: true })
  details: string | null;

  @OneToMany(
    () => Project,
    (project) => project.customer,
  )
  projects: Relation<Project>[];
}
