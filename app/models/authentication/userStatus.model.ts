import { AfterSync, AutoIncrement, Column, DataType, Model, PrimaryKey, Table } from "sequelize-typescript";

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

    @AfterSync
    static async insertStaticRoles() {
        const roles = ["Pending", "Active", "Rejected", "Archived"];
        for (const title of roles) {
            await UserStatus.findOrCreate({ where: { title } });
        }
    }
}