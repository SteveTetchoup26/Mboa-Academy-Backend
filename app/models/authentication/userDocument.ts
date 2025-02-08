import { AutoIncrement, Column, DataType, ForeignKey, Model, PrimaryKey, Table } from "sequelize-typescript";
import DocumentType from './documentType.model';

@Table({
    timestamps: true,
    tableName: 'user_document'
})
export default class UserDocument extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    id: number;

    @ForeignKey(() => DocumentType)
    @Column(DataType.INTEGER)
    document_type_id: number;

    @Column
    file_name: string;

    @Column
    format: string;
}