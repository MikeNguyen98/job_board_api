import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Token {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  token: string;

  @Column()
  type: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET';

  @Column()
  expiresAt: Date;
}
