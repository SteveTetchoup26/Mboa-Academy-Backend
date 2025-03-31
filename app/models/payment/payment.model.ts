import { AutoIncrement, BelongsTo, Column, DataType, ForeignKey, Model, PrimaryKey, Table } from "sequelize-typescript";
import User from "../authentication/user.model";
import Enrollment from "../enrollment/enrollment.model";
import PaymentMethod from "./paymentMethod.model";
import PaymentStatus from "./paymentStatus.model";
import Course from "../course/course.model";

@Table({
    timestamps: true,
    tableName: 'payment'
})
export default class Payment extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    id: number;

    @ForeignKey(() => User)
    @Column(DataType.INTEGER)
    student_id: number;

    @ForeignKey(() => Course)
    @Column(DataType.INTEGER)
    course_id: number;

    @ForeignKey(() => PaymentStatus)
    @Column(DataType.INTEGER)
    payment_status_id: number;

    @ForeignKey(() => PaymentMethod)
    @Column(DataType.INTEGER)
    payment_method_id: number;

    @Column
    amount: number;

    @BelongsTo(() => Course)
    course: Course;

    @BelongsTo(() => User)
    student: User;

    @BelongsTo(() => PaymentMethod)
    paymentMethod: PaymentMethod;

    @BelongsTo(() => PaymentStatus)
    status: PaymentStatus;
}