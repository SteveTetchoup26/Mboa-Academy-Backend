import { AfterSync, AutoIncrement, Column, DataType, HasMany, Model, PrimaryKey, Table } from "sequelize-typescript";
import { StatusUser } from "../../core/types";
import User from "./user.model";

@Table({
    timestamps: true,
    tableName: 'user_status'
})
export default class UserStatus extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    id: number;

    @Column
    title: string;

    @HasMany(() => User)
    users: User[];

    @AfterSync
    static async insertStaticStatuses() {
        const statuses = [StatusUser.PENDING, StatusUser.ACTIVE, StatusUser.REJECTED, StatusUser.ARCHIVED];
        for (const title of statuses) {
            await UserStatus.findOrCreate({ where: { title } });
        }
    }
}