import { AfterSync, AutoIncrement, Column, DataType, Model, PrimaryKey, Table } from "sequelize-typescript";

@Table({
    timestamps: true,
    tableName: 'document_type'
})
export default class DocumentType extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    id: number;

    @Column
    title: string;

    @AfterSync
    static async insertStaticRoles() {
        const roles = ["Photos", "Diplôme", "Autres"];
        for (const title of roles) {
            await DocumentType.findOrCreate({ where: { title } });
        }
    }
}