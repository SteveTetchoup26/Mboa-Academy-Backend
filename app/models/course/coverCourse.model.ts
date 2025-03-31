import { AutoIncrement, BelongsTo, Column, DataType, ForeignKey, Model, PrimaryKey, Table } from "sequelize-typescript";
import Course from "./course.model";

@Table({
    timestamps: true,
    tableName: 'cover_course',
})
export default class CoverCourse extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    id: number;

    @ForeignKey(() => Course)
    @Column(DataType.INTEGER)
    course_id: number;

    @Column
    file_name: string;

    @Column
    format: string;

    @BelongsTo(() => Course)
    course: Course;
}