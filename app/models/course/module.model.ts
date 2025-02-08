import { AutoIncrement, Column, DataType, ForeignKey, HasMany, Model, PrimaryKey, Table } from "sequelize-typescript";
import Course from "./course.model";
import Lesson from "./lesson.model";

@Table({
    timestamps: true,
    tableName: "module"
})
export default class Module extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    id: number;

    @ForeignKey(() => Course)
    @Column(DataType.INTEGER)
    course_id: number;

    @Column
    title: string;

    @Column
    resume: string;

    @HasMany(() => Lesson)
    lessons: Lesson[];
}