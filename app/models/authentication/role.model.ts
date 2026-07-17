import { AfterSync, AutoIncrement, BelongsToMany, Column, DataType, Model, PrimaryKey, Table } from "sequelize-typescript";
import { RoleType } from "../../core/types";
import User from "./user.model";
import UserRole from "./userRole.model";

@Table({
    timestamps: true,
    tableName: 'role'
})
export default class Role extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    id: number;

    @Column
    title: string;

    @BelongsToMany(() => User, () => UserRole)
    users: User[];

    @AfterSync
    static async insertStaticRoles() {
        const roles = [RoleType.SUPER_ADMIN, RoleType.ADMIN, RoleType.STUDENT, RoleType.INSTRUCTOR, RoleType.INSTITUTION];
        for (const title of roles) {
        await Role.findOrCreate({ where: { title } });
        }
    }
}