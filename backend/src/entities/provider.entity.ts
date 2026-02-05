import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("providers")
export class Provider {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column("simple-array")
  services: string[];
}
