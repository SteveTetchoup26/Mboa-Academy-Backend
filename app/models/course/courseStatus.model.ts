import { AfterSync, AutoIncrement, Column, DataType, HasMany, Model, PrimaryKey, Table } from "sequelize-typescript";
import { StatusCourse } from "../../core/types";
import Course from "./course.model";

@Table({
    timestamps: true,
    tableName: 'course_status'
})
export default class CourseStatus extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    id: number;

    @Column
    title: string;

    @HasMany(() => Course)
    courses: Course[];

    @AfterSync
    static async insertStaticStatuses() {
        const statuses = [StatusCourse.DRAFT, StatusCourse.SUBMIT, StatusCourse.PUBLISHED, StatusCourse.ARCHIVED];
        for (const title of statuses) {
            await CourseStatus.findOrCreate({ where: { title } });
        }
    }
}
