import { AutoIncrement, BelongsTo, Column, DataType, ForeignKey, Model, PrimaryKey, Table } from "sequelize-typescript";
import User from "../authentication/user.model";
import Course from "../course/course.model";

@Table({
    timestamps: true,
    tableName: "review"
})
export default class Review extends Model {
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

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        validate: { min: 1, max: 5 }
    })
    rating: number;

    @Column(DataType.TEXT)
    comment: string;

    @BelongsTo(() => User)
    student: User;

    @BelongsTo(() => Course)
    course: Course;
}
