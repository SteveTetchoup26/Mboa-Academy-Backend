import { AutoIncrement, BelongsTo, Column, DataType, ForeignKey, HasMany, Model, PrimaryKey, Table } from "sequelize-typescript";
import Institution from "../institution/institution.model";
import User from "../authentication/user.model";
import WebinarStatus from "./webinarStatus.model";
import WebinarRegistration from "./webinarRegistration.model";

@Table({
    timestamps: true,
    tableName: 'webinars'
})
export default class Webinar extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    id: number;

    @Column
    title: string;

    @Column(DataType.TEXT)
    description: string;

    @Column(DataType.DATE)
    start_date: Date;

    @Column(DataType.DATE)
    end_date: Date;

    @Column(DataType.INTEGER)
    duration: number; // en minutes — calculé à la création

    @Column
    meeting_link: string;

    @ForeignKey(() => WebinarStatus)
    @Column(DataType.INTEGER)
    status_id: number;

    @BelongsTo(() => WebinarStatus)
    status: WebinarStatus;

    @Column
    visibility: string; // 'public' | 'private'

    @Column
    access_code: string; // pour les webinaires privés

    @ForeignKey(() => Institution)
    @Column(DataType.INTEGER)
    institution_id: number;

    @BelongsTo(() => Institution)
    institution: Institution;

    @ForeignKey(() => User)
    @Column(DataType.INTEGER)
    instructor_id: number;

    @BelongsTo(() => User)
    instructor: User;

    @Column(DataType.INTEGER)
    max_participants: number;

    @HasMany(() => WebinarRegistration)
    registrations: WebinarRegistration[];
}
