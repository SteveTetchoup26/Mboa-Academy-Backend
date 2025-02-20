import { AutoIncrement, Column, DataType, ForeignKey, Model, PrimaryKey, Table } from "sequelize-typescript";
import User from "./user.model";
import Role from "./role.model";

@Table({
  timestamps: false,
  tableName: "user_role",
})
export default class UserRole extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @ForeignKey(() => User)
  @Column(DataType.INTEGER)
  user_id: number;

  @ForeignKey(() => Role)
  @Column(DataType.INTEGER)
  role_id: number;
}
