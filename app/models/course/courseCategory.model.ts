import { Column, DataType, ForeignKey, Model, PrimaryKey, Table } from "sequelize-typescript";
import Course from "./course.model";
import Category from "./category.model";

@Table({
    timestamps: true,
    tableName: "course_category",
})
export default class CourseCategory extends Model {
    @Column(DataType.INTEGER)
    id: number;

    @PrimaryKey
    @ForeignKey(() => Course)
    @Column(DataType.INTEGER)
    course_id: number;

    @PrimaryKey
    @ForeignKey(() => Category)
    @Column(DataType.INTEGER)
    category_id: number;
}