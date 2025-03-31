import { AutoIncrement, BelongsTo, Column, DataType, ForeignKey, Model, PrimaryKey, Table } from "sequelize-typescript";
import Forum from "./forum.model";
import User from "../authentication/user.model";

@Table({
    timestamps: true,
    tableName: 'message'
})
export default class Message extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    id: number;

    @Column
    text: string;

    @ForeignKey(() => Forum)
    @Column(DataType.INTEGER)
    forum_id: number;

    @ForeignKey(() => User)
    @Column(DataType.INTEGER)
    user_id: number;

    @Column(DataType.INTEGER)
    parent_id: number;

    @BelongsTo(() => Forum)
    forum: Forum;

    @BelongsTo(() => User)
    user: User;
}