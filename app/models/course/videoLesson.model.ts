import { AutoIncrement, BelongsTo, Column, DataType, ForeignKey, Model, PrimaryKey, Table } from "sequelize-typescript";
import Lesson from "./lesson.model";

@Table({
    timestamps: true,
    tableName: "video_lesson"
})
export default class VideoLesson extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    id: number;

    @ForeignKey(() => Lesson)
    @Column(DataType.INTEGER)
    lesson_id: number;

    @Column
    file_name: string;

    @Column
    format: string;

    @BelongsTo(() => Lesson)
    lesson: Lesson;
}