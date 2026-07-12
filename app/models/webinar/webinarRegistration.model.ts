import { AutoIncrement, BelongsTo, Column, DataType, ForeignKey, Model, PrimaryKey, Table } from "sequelize-typescript";
import Webinar from "./webinar.model";
import User from "../authentication/user.model";

@Table({
    timestamps: true,
    tableName: 'webinar_registrations'
})
export default class WebinarRegistration extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    id: number;

    @ForeignKey(() => Webinar)
    @Column(DataType.INTEGER)
    webinar_id: number;

    @BelongsTo(() => Webinar)
    webinar: Webinar;

    @ForeignKey(() => User)
    @Column(DataType.INTEGER)
    user_id: number;

    @BelongsTo(() => User)
    user: User;
}
