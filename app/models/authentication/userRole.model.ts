import { Column, DataType, ForeignKey, Model, PrimaryKey, Table } from "sequelize-typescript";
import User from "./user.model";
import Role from "./role.model";

@Table({
  timestamps: false,
  tableName: "user_role",
})
export default class UserRole extends Model {
  @Column(DataType.INTEGER)
  id: number;

  @PrimaryKey
  @ForeignKey(() => User)
  @Column(DataType.INTEGER)
  userId: number;

  @PrimaryKey
  @ForeignKey(() => Role)
  @Column(DataType.INTEGER)
  roleId: number;
}
