import { AutoIncrement, BelongsTo, BelongsToMany, Column, DataType, ForeignKey, Model, PrimaryKey, Table } from "sequelize-typescript";
import Role from "./role.model";
import UserStatus from "./userStatus.model";
import UserRole from "./userRole.model";

@Table({
    timestamps: true,
    tableName: 'user'
})
export default class User extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    id: number;

    @ForeignKey(() => UserStatus)
    @Column(DataType.INTEGER)
    status_id: number;

    @Column
    name: string;

    @Column
    email: string;

    @Column
    password: string;

    @BelongsTo(() => UserStatus)
    status: UserStatus;

    @BelongsToMany(() => Role, () => UserRole)
    roles: Role[];
}