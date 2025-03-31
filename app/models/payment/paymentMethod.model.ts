import { AfterSync, AutoIncrement, Column, DataType, HasMany, Model, PrimaryKey, Table } from "sequelize-typescript";
import Payment from "./payment.model";
import { MethodPayment } from "../../core/types";

@Table({
    timestamps: true,
    tableName: 'payment_method',
})
export default class PaymentMethod extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    id: number;

    @Column
    title: string;

    @Column
    description: string;

    @Column
    logo: string;

    @HasMany(() => Payment)
    payments: Payment[];

    @AfterSync
    static async insertStaticMethod() {
        const methods = [MethodPayment.OM, MethodPayment.MOMO, MethodPayment.VISA, MethodPayment.MASTERCARD, MethodPayment.PAYPAL];
        for (const title of methods) {
            await PaymentMethod.findOrCreate({ where: { title } });
        }
    }
}