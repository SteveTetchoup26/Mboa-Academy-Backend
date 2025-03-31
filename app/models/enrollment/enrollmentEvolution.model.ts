import { AutoIncrement, BelongsTo, Column, DataType, ForeignKey, Model, PrimaryKey, Table } from "sequelize-typescript";
import Enrollment from "./enrollment.model";
import Lesson from "../course/lesson.model";
import EnrollmentStatus from "./enrollmentStatus.model";

@Table({
    timestamps: true,
    tableName: 'enrollment_evolution'
})
export default class EnrollmentEvolution extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    id: number;

    @ForeignKey(() => Enrollment)
    @Column(DataType.INTEGER)
    enrollment_id: number;

    @ForeignKey(() => Lesson)
    @Column(DataType.INTEGER)
    lesson_id: number;

    @ForeignKey(() => EnrollmentStatus)
    @Column(DataType.INTEGER)
    enrollment_status_id: number;

    @Column(DataType.INTEGER)
    progress: number;

    @BelongsTo(() => Enrollment)
    enrollment: Enrollment;

    @BelongsTo(() => Lesson)
    lesson: Lesson;

    @BelongsTo(() => EnrollmentStatus)
    status: EnrollmentStatus;

}