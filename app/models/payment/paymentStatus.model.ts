import { AfterSync, AutoIncrement, Column, DataType, HasMany, Model, PrimaryKey, Table } from "sequelize-typescript";
import Payment from "./payment.model";
import { StatusPayment } from "../../core/types";

@Table({
    timestamps: true,
    tableName: 'payment_status',
})
export default class PaymentStatus extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    id: number;

    @Column
    title: string;

    @HasMany(() => Payment)
    payments: Payment[];

    
    @AfterSync
    static async insertStaticStatuses() {
        const statuses = [StatusPayment.PENDING, StatusPayment.COMPLETED, StatusPayment.REJECTED, StatusPayment.FAILED];
        for (const title of statuses) {
            await PaymentStatus.findOrCreate({ where: { title } });
        }
    }
}