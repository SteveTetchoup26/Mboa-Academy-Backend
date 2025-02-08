import { AutoIncrement, BelongsTo, BelongsToMany, Column, DataType, ForeignKey, HasMany, HasOne, Model, PrimaryKey, Table } from "sequelize-typescript";
import User from "../authentication/user.model";
import CourseStatus from "./courseStatus.model";
import LanguageCourse from "./language.model";
import Feature from "./feature.model";
import Objective from "./objective.model";
import Category from "./category.model";
import CourseCategory from "./courseCategory.model";
import Forum from "../forum/forum.model";
import Note from "./note.model";
import Certificate from "./certificate.model";

@Table({
    timestamps: true,
    tableName: "course"
})
export default class Course extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    id: number;

    @ForeignKey(() => User)
    @Column(DataType.INTEGER)
    instructor_id: number;

    @ForeignKey(() => LanguageCourse)
    @Column(DataType.INTEGER)
    language_id: number;

    @ForeignKey(() => CourseStatus)
    @Column(DataType.INTEGER)
    status_id: number;

    @Column
    title: string;

    @Column
    description: string;

    @Column
    price: number;

    @Column
    original_price: number;

    @BelongsTo(() => User)
    instructor: User;

    @BelongsTo(() => LanguageCourse)
    language: LanguageCourse;

    @BelongsTo(() => CourseStatus)
    status: CourseStatus;

    @HasMany(() => Feature)
    features: Feature[];

    @HasMany(() => Objective)
    objectives: Objective[];

    @BelongsToMany(() => Category, () => CourseCategory)
    categories: Category[];

    @HasOne(() => Forum)
    forum: Forum;

    @HasMany(() => Note)
    notes: Note[];

    @HasOne(() => Certificate)
    certificate: Certificate;
}