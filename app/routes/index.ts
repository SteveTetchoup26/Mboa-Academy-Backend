import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as path from 'path';
import cors from 'cors';
import helmet from 'helmet';

// import * as config from '../core/config';

import { AuthRoute } from './auth.route';
import { authMiddleware } from '../core/middleware/auth';
import { UserRoute } from './user.route';
import { CategoryRoute } from './category.route';
import { CourseRoute } from './course.route';
import { EnrollmentRoute } from './enrollment.route';
import { PaymentRoute } from './payment.route';
import { AdminRoute } from './admin/auth.route';

/**
 * Global router configuration of the application
 *
 * @class
 */
class Routes {
	/**
   * @param  {Application} app
   *
   * @returns void
   */
	static init(app: express.Application): void {
		const router: express.Router = express.Router();

        // Express middleware
        app.use(helmet());
		app.use(cors({
			origin: [
				process.env.FRONTEND_URL || 'http://localhost:5173',
				/\.vercel\.app$/,   // autorise tous les sous-domaines vercel.app (previews)
			],
			credentials: true,
		}));
		app.use(bodyParser.urlencoded({ extended: true }));
		app.use(bodyParser.json());

		app.set('view engine', 'handlebars');

		// Static content
		app.use(express.static(path.join(__dirname, '../../public')));

		app.use(authMiddleware);

		app.use('/', router);

		// auth
		app.use('/', new AuthRoute().router);

		//users
		app.use('/', new UserRoute().router);

		//courses
		app.use('/', new CourseRoute().router);

		//payments
		app.use('/', new PaymentRoute().router);

		//categories
		app.use('/', new CategoryRoute().router);

		//enrollments
		app.use('/', new EnrollmentRoute().router);

		app.use('/', new AdminRoute().router);
		
	}
}

export { Routes };
