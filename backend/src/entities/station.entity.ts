import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("stations")
export class Station {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  location: string;
}
