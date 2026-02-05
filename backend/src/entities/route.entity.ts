import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("routes")
export class Route {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  startStation: string;

  @Column()
  endStation: string;

  @Column("float")
  distance: number;
}
