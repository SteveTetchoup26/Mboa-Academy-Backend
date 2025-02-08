import { AutoIncrement, BelongsToMany, Column, DataType, Model, PrimaryKey, Table } from "sequelize-typescript";
import Course from "./course.model";
import CourseCategory from "./courseCategory.model";

@Table({
    timestamps: true,
    tableName: "category",
})
export default class Category extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    id: number;

    @Column
    title: string;

    @Column
    description: string;

    @BelongsToMany(() => Course, () => CourseCategory)
    courses: Course[];
}