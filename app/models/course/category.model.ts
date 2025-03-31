import { AutoIncrement, BelongsTo, BelongsToMany, Column, DataType, ForeignKey, Model, PrimaryKey, Table } from "sequelize-typescript";
import Course from "./course.model";
import CourseCategory from "./courseCategory.model";
import User from "../authentication/user.model";

@Table({
    timestamps: true,
    tableName: "category",
})
export default class Category extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    id: number;

    @ForeignKey(() => User)
    @Column(DataType.INTEGER)
    admin_id: number;

    @Column
    title: string;

    @Column
    description: string;

    @BelongsToMany(() => Course, () => CourseCategory)
    courses: Course[];

    @BelongsTo(() => User)
    admin: User;
}