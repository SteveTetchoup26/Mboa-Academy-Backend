import { AutoIncrement, BelongsTo, BelongsToMany, Column, DataType, ForeignKey, HasMany, Model, PrimaryKey, Table } from "sequelize-typescript";

import UserStatus from "./userStatus.model";
import User from "./user.model";


@Table({
    timestamps: true,
    tableName: 'expertise'
})
export default class Expertise extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    id: number;

    @ForeignKey(() => User)
    @Column(DataType.INTEGER)
    user_id: number;

    @Column
    domain: string;

    @Column
    job_title: string;

    @BelongsTo(() => User)
    instructor: User;

}