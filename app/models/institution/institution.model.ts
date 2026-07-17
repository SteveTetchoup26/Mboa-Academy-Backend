import { AutoIncrement, BelongsTo, Column, DataType, ForeignKey, HasMany, Model, PrimaryKey, Table } from "sequelize-typescript";
import InstitutionType from "./institutionType.model";
import InstitutionStatus from "./institutionStatus.model";
import InstitutionAdmin from "./institutionAdmin.model";
import Course from "../course/course.model";
import Certificate from "../course/certificate.model";

@Table({
    timestamps: true,
    tableName: "institution"
})
export default class Institution extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    id: number;

    @Column
    name: string;

    @Column({ unique: true })
    slug: string;

    @Column(DataType.TEXT)
    description: string;

    @Column
    address: string;

    @Column
    city: string;

    @Column
    country: string;

    @Column
    phone: string;

    @Column
    email: string;

    @Column
    website: string;

    @Column
    logo_url: string;

    @Column
    brand_color: string;

    @ForeignKey(() => InstitutionType)
    @Column(DataType.INTEGER)
    type_id: number;

    @ForeignKey(() => InstitutionStatus)
    @Column(DataType.INTEGER)
    status_id: number;

    @BelongsTo(() => InstitutionType)
    type: InstitutionType;

    @BelongsTo(() => InstitutionStatus)
    status: InstitutionStatus;

    @HasMany(() => InstitutionAdmin)
    admins: InstitutionAdmin[];

    @HasMany(() => Course)
    courses: Course[];

    @HasMany(() => Certificate)
    certificates: Certificate[];
}
