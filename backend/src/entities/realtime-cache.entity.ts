import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("realtime_cache")
export class RealtimeCache {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  key: string;

  @Column("text")
  value: string;

  @Column("timestamp")
  expiration: Date;
}
