import { Column, DataType, ForeignKey, Model, Table } from "sequelize-typescript";
import User from "./user.model";
import Role from "./role.model";

@Table({
  timestamps: false,
  tableName: "user_role",
})
export default class UserRole extends Model {
  @ForeignKey(() => User)
  @Column(DataType.INTEGER)
  userId: number;

  @ForeignKey(() => Role)
  @Column(DataType.INTEGER)
  roleId: number;
}
