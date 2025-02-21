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
		app.use(cors());
		app.use(bodyParser.urlencoded({ extended: true }));
		app.use(bodyParser.json());

		app.set('view engine', 'handlebars');

		app.use(authMiddleware);

		app.use('/', router);

		// auth
		app.use('/', new AuthRoute().router);

		//users
		app.use('/', new UserRoute().router);

		//courses
		app.use('/', new CourseRoute().router);
		//categories
		app.use('/', new CategoryRoute().router);


		// Static content
		app.use(express.static(path.join(__dirname, '../public')));
	}
}

export { Routes };
