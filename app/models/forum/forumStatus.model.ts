import { AfterSync, AutoIncrement, Column, DataType, HasMany, Model, PrimaryKey, Table } from "sequelize-typescript";
import { StatusForum } from "../../core/types";
import Forum from "./forum.model";

@Table({
    timestamps: true,
    tableName: 'forum_status',
})
export default class ForumStatus extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    id: number;

    @Column
    title: string;

    @HasMany(() => Forum)
    forums: Forum[];

    @AfterSync
    static async insertStaticStatuses() {
        const statuses = [StatusForum.OPEN, StatusForum.CLOSED, StatusForum.REJECTED, StatusForum.ARCHIVED];
        for (const title of statuses) {
            await ForumStatus.findOrCreate({ where: { title } });
        }
    }
}