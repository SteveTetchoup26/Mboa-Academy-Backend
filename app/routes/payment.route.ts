import { Router } from 'express';

import { API_BASE } from '../core/config';

import { PaymentController } from '../controllers/payment.controller';


/**
 * Router configuration for user
 *
 * @class
 */
class PaymentRoute {
	public router: Router;

	constructor() {
		this.router = Router();
		this.routes();
	}

	routes(): void {
		const prefix: string = `${API_BASE}/payments`;

        this.router.post(`${prefix}/create`, PaymentController.create);

		this.router.get(`${prefix}`, PaymentController.all);

		this.router.get(`${prefix}/:id`, PaymentController.one);

	}
}

export { PaymentRoute };
