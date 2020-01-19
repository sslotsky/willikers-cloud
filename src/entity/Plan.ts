import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity()
export class Plan {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column()
  name: string;

  @Column('int')
  amount: number;

  @Column()
  currency: string;

  @Column()
  interval: 'month' | 'year';
}
