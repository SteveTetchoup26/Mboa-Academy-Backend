import { AfterSync, AutoIncrement, Column, DataType, Model, PrimaryKey, Table } from "sequelize-typescript";

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

    @AfterSync
    static async insertStaticRoles() {
        const roles = ["Admin", "Student", "Instructor"];
        for (const title of roles) {
        await Role.findOrCreate({ where: { title } });
        }
    }
}