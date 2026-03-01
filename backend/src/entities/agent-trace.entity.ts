import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity("agent_traces")
export class AgentTrace {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", length: 255 })
  agentId: string;

  @Column({ type: "jsonb" })
  payload: Record<string, unknown>;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;
}
