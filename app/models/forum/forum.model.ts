import { AutoIncrement, BelongsTo, Column, DataType, ForeignKey, HasMany, Model, PrimaryKey, Table } from "sequelize-typescript";
import Course from "../course/course.model";
import ForumStatus from "./forumStatus.model";
import Message from "./message.model";

@Table({
    timestamps: true,
    tableName: 'forum'
})
export default class Forum extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    id: number;

    @ForeignKey(() => Course)
    @Column(DataType.INTEGER)
    courseId: number;

    @ForeignKey(() => ForumStatus)
    @Column(DataType.INTEGER)
    forum_status_id: number;

    @Column
    title: string;

    @Column
    description: string;

    @BelongsTo(() => Course)
    course: Course;

    @BelongsTo(() => ForumStatus)
    status: ForumStatus;

    @HasMany(() => Message)
    messages: Message[];
}