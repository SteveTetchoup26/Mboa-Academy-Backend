import { AfterSync, AutoIncrement, Column, DataType, HasMany, Model, PrimaryKey, Table } from "sequelize-typescript";
import { StatusEnrollment } from "../../core/types";
import Enrollment from "./enrollment.model";
import EnrollmentEvolution from "./enrollmentEvolution.model";

@Table({
    timestamps: true,
    tableName: 'enrollment_status'
})
export default class EnrollmentStatus extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    id: number;

    @Column
    title: string;

    @HasMany(() => Enrollment)
    enrollments: Enrollment[];

    @HasMany(() => EnrollmentEvolution)
    enrollment_evolutions: EnrollmentEvolution[];

    @AfterSync
    static async insertStaticStatuses() {
        const statuses = [StatusEnrollment.INIT, StatusEnrollment.ONGOING, StatusEnrollment.COMPLETED, StatusEnrollment.ARCHIVED];
        for (const title of statuses) {
            await EnrollmentStatus.findOrCreate({ where: { title } });
        }
    }
}