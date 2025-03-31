import { AfterSync, AutoIncrement, Column, DataType, HasMany, Model, PrimaryKey, Table } from "sequelize-typescript";
import { TypeDocument } from "../../core/types";
import UserDocument from "./userDocument.model";

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

    @HasMany(() => UserDocument)
    documents: UserDocument[];

    @AfterSync
    static async insertStaticRoles() {
        const roles = [TypeDocument.PHOTOS, TypeDocument.DIPLOME, TypeDocument.AUTRES];
        for (const title of roles) {
            await DocumentType.findOrCreate({ where: { title } });
        }
    }
}