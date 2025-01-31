import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type LogDocument = HydratedDocument<Log>;

@Schema()
export class Log {
  @Prop({ required: true })
  message: string;

  @Prop({ required: true, default: Date.now })
  timestamp: Date;

  @Prop({ required: true })
  level: string; // e.g., 'info', 'error'
}

export const LogSchema = SchemaFactory.createForClass(Log);
