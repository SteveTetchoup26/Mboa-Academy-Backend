import { AutoIncrement, Column, DataType, HasMany, Model, PrimaryKey, Table } from "sequelize-typescript";
import Course from "./course.model";

@Table({
    timestamps: true,
    tableName: "language_course"
})
export default class LanguageCourse extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    id: number;

    @Column
    code: string;

    @Column
    description: string;

    @HasMany(() => Course)
    courses: Course[];
}