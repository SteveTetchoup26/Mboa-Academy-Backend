import { AfterSync, AutoIncrement, Column, DataType, HasMany, Model, PrimaryKey, Table } from "sequelize-typescript";
import Webinar from "./webinar.model";

@Table({
    timestamps: true,
    tableName: 'webinar_status'
})
export default class WebinarStatus extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    id: number;

    @Column
    title: string;

    @HasMany(() => Webinar)
    webinars: Webinar[];

    @AfterSync
    static async insertStaticStatuses() {
        const statuses = ['Upcoming', 'Live', 'Past', 'Cancelled'];
        for (const title of statuses) {
            await WebinarStatus.findOrCreate({ where: { title } });
        }
    }
}
