import { AutoIncrement, BelongsTo, Column, DataType, ForeignKey, HasOne, Model, PrimaryKey, Table } from "sequelize-typescript";
import Module from "./module.model";
import VideoLesson from "./videoLesson.model";

@Table({
    timestamps: true,
    tableName: "lesson"
})
export default class Lesson extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    id: number;

    @ForeignKey(() => Module)
    @Column(DataType.INTEGER)
    module_id: number;

    @Column
    title: string;

    @Column
    resume: string;

    @BelongsTo(() => Module)
    module: Module;

    @HasOne(() => VideoLesson)
    video: VideoLesson;
}