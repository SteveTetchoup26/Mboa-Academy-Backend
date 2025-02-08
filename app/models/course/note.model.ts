import { AutoIncrement, BelongsTo, Column, DataType, ForeignKey, Model, PrimaryKey, Table } from "sequelize-typescript";
import Course from "./course.model";
import User from "../authentication/user.model";

@Table({
    timestamps: true,
    tableName: 'note'
})
export default class Note extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    id: number;

    @ForeignKey(() => Course)
    @Column(DataType.INTEGER)
    course_id: number;

    @ForeignKey(() => User)
    @Column(DataType.INTEGER)
    student_id: number;

    @Column(DataType.INTEGER)
    stars: number;

    @BelongsTo(() => Course)
    course: Course;

    @BelongsTo(() => User)
    user: User;
}