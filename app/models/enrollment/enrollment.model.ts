import { AutoIncrement, BelongsTo, Column, DataType, ForeignKey, HasMany, Model, PrimaryKey, Table } from "sequelize-typescript";
import Course from "../course/course.model";
import User from "../authentication/user.model";
import EnrollmentStatus from "./enrollmentStatus.model";
import Payment from "../payment/payment.model";

@Table({
    timestamps: true,
    tableName: 'enrollment'
})
export default class Enrollment extends Model {
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

    @ForeignKey(() => EnrollmentStatus)
    @Column(DataType.INTEGER)
    status_id: number;

    @Column(DataType.INTEGER)
    progress: number;

    @Column
    completedAt: Date;

    @BelongsTo(() => EnrollmentStatus)
    status: EnrollmentStatus;

    @BelongsTo(() => Course)
    course: Course;

    @BelongsTo(() => User)
    student: User;
}