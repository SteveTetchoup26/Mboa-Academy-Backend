import { AutoIncrement, BelongsTo, Column, DataType, ForeignKey, Model, PrimaryKey, Table } from "sequelize-typescript";
import Course from "./course.model";
import User from "../authentication/user.model";

@Table({
    timestamps: true,
    tableName: 'certificate'
})
export default class Certificate extends Model {
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

    @Column
    file_name: string;

    @BelongsTo(() => Course)
    course: Course;

    @BelongsTo(() => User)
    student: User;
}