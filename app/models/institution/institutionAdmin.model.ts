import { AutoIncrement, BelongsTo, Column, DataType, ForeignKey, Model, PrimaryKey, Table } from "sequelize-typescript";
import Institution from "./institution.model";
import User from "../authentication/user.model";

@Table({
    timestamps: true,
    tableName: "institution_admin"
})
export default class InstitutionAdmin extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    id: number;

    @ForeignKey(() => Institution)
    @Column(DataType.INTEGER)
    institution_id: number;

    @ForeignKey(() => User)
    @Column(DataType.INTEGER)
    user_id: number;

    @Column
    role: string;

    @BelongsTo(() => Institution)
    institution: Institution;

    @BelongsTo(() => User)
    user: User;
}
