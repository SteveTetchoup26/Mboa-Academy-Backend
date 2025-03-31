/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';

import { CustomRequest } from '../core/types';
import { i18next } from '../core/i18n';
import Course from '../models/course/course.model';
import CourseStatus from '../models/course/courseStatus.model';
import Module from '../models/course/module.model';
import Objective from '../models/course/objective.model';
import Feature from '../models/course/feature.model';
import Note from '../models/course/note.model';
import CoverCourse from '../models/course/coverCourse.model';
import User from '../models/authentication/user.model';
import LanguageCourse from '../models/course/language.model';
import Category from '../models/course/category.model';
import Lesson from '../models/course/lesson.model';
import VideoLesson from '../models/course/videoLesson.model';
import CourseCategory from '../models/course/courseCategory.model';
import { Op } from 'sequelize';
import Expertise from '../models/authentication/expertise.model';
import Enrollment from '../models/enrollment/enrollment.model';
import EnrollmentStatus from '../models/enrollment/enrollmentStatus.model';



/**
 * Controller for course details
 *
 * @class
 */
class CourseController {
     /**
   * create()
   *
   * create course in the database
   *
   * @param {Request} req: Request object
   * @param {Response} res: Response object
   * @param {NextFunction} next: NextFunction object
   *
   * @return Object
   */
    public static async create(req: CustomRequest | any, res: Response,): Promise<any> {
        const {
            title,
            description,
            price,
            original_price,
            language,
            features,
            objectives,
            modules,
            categories,
            cover_course,
        } = req.body;

        const transaction = await Course.sequelize?.transaction();

        try {
            const language_course = await LanguageCourse.create({
                ...language
            })

            const status: CourseStatus | null = await CourseStatus.findOne({
                where: { title: 'Submit'}
            })

            const course = await Course.create({
                title,
                description,
                price,
                original_price,
                instructor_id: req.userId,
                language_id: language_course.id,
                status_id: status?.id,
            }, { transaction });
            
            
            if (features && features.length > 0) {
                await Feature.bulkCreate(features.map((feature: any) => ({
                    title: feature,
                    course_id: course.id,
                })), { transaction });
            }

            
            if (objectives && objectives.length > 0) {
                await Objective.bulkCreate(objectives.map((objective: any) => ({
                    title: objective,
                    course_id: course.id,
                })), { transaction });
            }

            
            if (modules && modules.length > 0) {
                for (const moduleData of modules) {
                    const module = await Module.create({
                        ...moduleData,
                        course_id: course.id,
                    }, { transaction });

                    
                    if (moduleData.lessons && moduleData.lessons.length > 0) {
                        // for (const lessonData of moduleData.lessons) {
                        //     const lesson = await Lesson.create({
                        //         ...lessonData,
                        //         module_id: module.id,
                        //     }, { transaction });

                        //     if (lessonData.video) {
                        //         await VideoLesson.create({
                        //             ...lessonData.video,
                        //             lesson_id: lesson.id,
                        //         }, { transaction });
                        //     }
                        // }
                        for (let i = 0; i < moduleData.lessons.length; i++) {
                            const lessonData = moduleData.lessons[i];
    
                            const lesson = await Lesson.create({
                                title: lessonData.title,
                                resume: lessonData.resume,
                                module_id: module.id,
                            }, { transaction });
    
                            // Associer la vidéo à la leçon
                            if (req.files && "videos" in req.files && (req.files as any).videos[i]) {
                                const videoFile = (req.files as any).videos[i];
    
                                await VideoLesson.create({
                                    lesson_id: lesson.id,
                                    file_name: `${videoFile.filename}`,
                                    format: videoFile.mimetype
                                }, { transaction });
                            }
                        }
                    }
                }
            }

            if(categories && categories.length > 0){
                for(const category of categories){
                    const cat = await Category.create({
                        title: category.title,
                        description: category.description,
                    });
                    // admin_id: userRole.user_id,
                    // const cat: Category | null = await Category.findOne({
                    //     where: { title: category }
                    // });
                    
                    await CourseCategory.create({
                        course_id: course.id,
                        category_id: cat?.id,
                    }, { transaction });
                }
            }

            
            if (cover_course) {
                await CoverCourse.create({
                    ...cover_course,
                    course_id: course.id,
                }, { transaction });
            }

            await transaction?.commit();

            res.status(201).json({ message: i18next.t('course.submited')});  
        } catch (err) {
            await transaction?.rollback();

            console.error(err);
            res.status(500).json({ message: i18next.t('internal.error') });
        }
  }


    /**
   * all()
   *
   * Get all courses in the database
   *
   * @param {Request} req: Request object
   * @param {Response} res: Response object
   * @param {NextFunction} next: NextFunction object
   *
   * @return Object
   */
    public static async all(req: Request, res: Response): Promise<any> {
		try {
            const status: CourseStatus | null = await CourseStatus.findOne({
                where: { title: 'Archived' }
            });
            
			const courses: Array<Course> = await Course.findAll({
                attributes: {
                    exclude: ['instructor_id', 'language_id','createdAt', 'updatedAt']
                },
                order: [['createdAt', 'DESC']],
                include: [
                    {
                        model: Module,
                        include: [
                            {
                                model: Lesson,
                                include: [
                                    {
                                        model: VideoLesson,
                                        attributes: {
                                            exclude: ['lesson_id', 'createdAt', 'updatedAt']
                                        }
                                    }
                                ],
                                attributes: {
                                    exclude: ['module_id', 'createdAt', 'updatedAt']
                                }
                            }
                        ],
                        attributes: {
                            exclude: ['course_id', 'createdAt', 'updatedAt']
                        } 
                    },
                    {
                        model: Category,
                        through: { attributes: [] },
                        attributes: {
                            exclude: ['admin_id', 'createdAt', 'updatedAt']
                        }
                    },
                    {
                        model: Objective,
                        attributes: {
                            exclude: ['course_id', 'createdAt', 'updatedAt']
                        }
                    }, 
                    {
                        model: Feature,
                        attributes: {
                            exclude: ['course_id', 'createdAt', 'updatedAt']
                        }
                    }, 
                    Note, 
                    {
                        model: CoverCourse,
                        attributes: {
                            exclude: ['course_id', 'createdAt', 'updatedAt']
                        }
                    }, 
                    {
                        model: User,
                        attributes: {
                            exclude: ['status_id', 'password', 'createdAt', 'updatedAt']
                        }
                    }, 
                    {
                        model: CourseStatus,
                        attributes: {
                            exclude: ['createdAt', 'updatedAt']
                        }
                    }, 
                    {
                        model: LanguageCourse,
                        attributes: {
                            exclude: ['createdAt', 'updatedAt']
                        }
                    },
                ],
                where: { 
                    status_id: { [Op.ne]: status?.id }
                }
            });

			return res.status(200).json({ courses });
		} catch (err) {
			console.log(err);

			return res.status(500).json({ error: i18next.t('internal.error') });
		}
	}

    /**
   * one()
   *
   * Get an course by it's ID
   *
   * @param {Request} req: Request object
   * @param {Response} res: Response object
   * @param {NextFunction} next: NextFunction object
   *
   * @return Object
   */
	public static async one(req: Request, res: Response): Promise<any> {
		try {
            const status: CourseStatus | null = await CourseStatus.findOne({
                where: { title: 'Archived' }
            });

			const course: Course | null = await Course.findOne({ 
                where: { id: req.params.id },
                attributes: {
                    exclude: ['instructor_id', 'language_id','createdAt']
                },
                include: [
                    {
                        model: Module,
                        include: [
                            {
                                model: Lesson,
                                include: [
                                    {
                                        model: VideoLesson,
                                        attributes: {
                                            exclude: ['lesson_id', 'createdAt', 'updatedAt']
                                        }
                                    }
                                ],
                                attributes: {
                                    exclude: ['module_id', 'createdAt', 'updatedAt']
                                }
                            }
                        ],
                        attributes: {
                            exclude: ['course_id', 'createdAt', 'updatedAt']
                        } 
                    },
                    {
                        model: Category,
                        through: { attributes: [] },
                        attributes: {
                            exclude: ['admin_id', 'createdAt', 'updatedAt']
                        }
                    },
                    {
                        model: Objective,
                        attributes: {
                            exclude: ['course_id', 'createdAt', 'updatedAt']
                        }
                    }, 
                    {
                        model: Feature,
                        attributes: {
                            exclude: ['course_id', 'createdAt', 'updatedAt']
                        }
                    }, 
                    Note, 
                    {
                        model: CoverCourse,
                        attributes: {
                            exclude: ['course_id', 'createdAt', 'updatedAt']
                        }
                    }, 
                    {
                        model: User,
                        include: [
                            {
                                model: Expertise,
                                attributes: {
                                    exclude: ['instructor_id', 'createdAt', 'updatedAt']
                                }
                            }
                        ],
                        attributes: {
                            exclude: ['status_id', 'password', 'createdAt', 'updatedAt']
                        }
                    }, 
                    {
                        model: CourseStatus,
                        attributes: {
                            exclude: ['createdAt', 'updatedAt']
                        }
                    }, 
                    {
                        model: LanguageCourse,
                        attributes: {
                            exclude: ['createdAt', 'updatedAt']
                        }
                    },
                    {
                        model: Enrollment,
                        include: [
                            {
                                model: EnrollmentStatus,
                                attributes: {
                                    exclude: ['createdAt', 'updatedAt']
                                }
                            }
                        ],
                        attributes: {
                            exclude: ['course_id', 'createdAt', 'updatedAt']
                        }
                    }
                ]
            });

			if (!course || course.status_id === status?.id) {
				return res.status(404).json({ message: i18next.t('model.not.found', { model: 'Course' }) });
			}

			return res.status(200).json({ course });
		} catch (err) {
			console.log(err);

			return res.status(500).json({ error: i18next.t('internal.error') });
		}
	}

    /**
   * destroy()
   *
   * Delete (archived) an course in the database
   *
   * @param {Request} req: Request object
   * @param {Response} res: Response object
   * @param {NextFunction} next: NextFunction object
   *
   * @return Object
   */
	public static async destroy(req: CustomRequest|any, res: Response): Promise<any> {
		const id: number = req.params.id;
		try {
            const course: Course | null = await Course.findOne({ where: { id } });
            if (!course) {
                return res.status(404).json({ message: i18next.t('model.not.found', { model: 'Course' }) });
            }

			if (req.userId === course.instructor_id) {
                const status: CourseStatus | null = await CourseStatus.findOne({ where: { title: 'Archived'}});
				await Course.update({
                    status_id: status?.id
                },{
                    where: { id }
                });
			}

			return res.status(200).json({ message: i18next.t('model.deleted', { model: 'Course' }) });
		} catch (err) {
			console.log(err);

			return res.status(500).json({ error: i18next.t('internal.error') });
		}
	}

     /**
   * update()
   *
   * update course in the database
   *
   * @param {Request} req: Request object
   * @param {Response} res: Response object
   * @param {NextFunction} next: NextFunction object
   *
   * @return Object
   */
     public static async update(req: CustomRequest | any, res: Response): Promise<any> {
        const courseId = req.params.id;
        const {
            title,
            description,
            price,
            original_price,
            language,
            features,
            objectives,
            modules,
            categories,
            cover_course,
        } = req.body;
    
        const transaction = await Course.sequelize?.transaction();
    
        try {
            const course: Course | null = await Course.findByPk(courseId, { transaction });
            if (!course) {
                await transaction?.rollback();
                return res.status(404).json({ message: i18next.t('model.not.found', { model: 'Course' }) });
            }
    
            await course.update({
                title,
                description,
                price,
                original_price,
            }, { transaction });
    
            
            if (language) {
                const language_course = await LanguageCourse.create({
                    ...language
                }, { transaction });
                course.language_id = language_course.id;
                await course.save({ transaction });
            }
    
            
            if (features && features.length > 0) {
                await Feature.destroy({ where: { course_id: course.id }, transaction });
                await Feature.bulkCreate(features.map((feature: any) => ({
                    ...feature,
                    course_id: course.id,
                })), { transaction });
            }
    
            
            if (objectives && objectives.length > 0) {
                await Objective.destroy({ where: { course_id: course.id }, transaction });
                await Objective.bulkCreate(objectives.map((objective: any) => ({
                    ...objective,
                    course_id: course.id,
                })), { transaction });
            }
    
            
            if (modules && modules.length > 0) {
                await Module.destroy({ where: { course_id: course.id }, transaction });
    
                for (const moduleData of modules) {
                    const module = await Module.create({
                        ...moduleData,
                        course_id: course.id,
                    }, { transaction });
    
                    if (moduleData.lessons && moduleData.lessons.length > 0) {
                        await Lesson.destroy({ where: { module_id: module.id }, transaction });
    
                        for (const lessonData of moduleData.lessons) {
                            const lesson = await Lesson.create({
                                ...lessonData,
                                module_id: module.id,
                            }, { transaction });
    
                            if (lessonData.video) {
                                await VideoLesson.destroy({ where: { lesson_id: lesson.id }, transaction });
                                await VideoLesson.create({
                                    ...lessonData.video,
                                    lesson_id: lesson.id,
                                }, { transaction });
                            }
                        }
                    }
                }
            }
    
            
            if (categories && categories.length > 0) {
                await CourseCategory.destroy({ where: { course_id: course.id }, transaction });
    
                for (const category of categories) {
                    const cat: Category | null = await Category.findOne({
                        where: { title: category }
                    });
    
                    if (cat) {
                        await CourseCategory.create({
                            course_id: course.id,
                            category_id: cat.id,
                        }, { transaction });
                    }
                }
            }
    
            
            if (cover_course) {
                await CoverCourse.destroy({ where: { course_id: course.id }, transaction });
                await CoverCourse.create({
                    ...cover_course,
                    course_id: course.id,
                }, { transaction });
            }
    
            
            await transaction?.commit();
    
            res.status(200).json({ message: i18next.t('model.saved', { model: 'Course' }) });
        } catch (err) {
            
            await transaction?.rollback();
    
            console.error(err);
            res.status(500).json({ message: i18next.t('internal.error') });
        }
    }


    /**
   * allCoursesByIntructor()
   *
   * Get all courses created by some instructor in the database
   *
   * @param {Request} req: Request object
   * @param {Response} res: Response object
   * @param {NextFunction} next: NextFunction object
   *
   * @return Object
   */
    public static async allCoursesByIntructor(req: CustomRequest | any, res: Response): Promise<any> {
		try {
            if(req.userId){
                const status: CourseStatus | null = await CourseStatus.findOne({
                    where: { title: 'Archived' }
                });
                
                const courses: Array<Course> = await Course.findAll({
                    attributes: {
                        exclude: ['instructor_id', 'language_id','createdAt', 'updatedAt']
                    },
                    order: [['createdAt', 'DESC']],
                    include: [
                        {
                            model: Module,
                            include: [
                                {
                                    model: Lesson,
                                    include: [
                                        {
                                            model: VideoLesson,
                                            attributes: {
                                                exclude: ['lesson_id', 'createdAt', 'updatedAt']
                                            }
                                        }
                                    ],
                                    attributes: {
                                        exclude: ['module_id', 'createdAt', 'updatedAt']
                                    }
                                }
                            ],
                            attributes: {
                                exclude: ['course_id', 'createdAt', 'updatedAt']
                            } 
                        },
                        {
                            model: Category,
                            through: { attributes: [] },
                            attributes: {
                                exclude: ['admin_id', 'createdAt', 'updatedAt']
                            }
                        },
                        {
                            model: Objective,
                            attributes: {
                                exclude: ['course_id', 'createdAt', 'updatedAt']
                            }
                        }, 
                        {
                            model: Feature,
                            attributes: {
                                exclude: ['course_id', 'createdAt', 'updatedAt']
                            }
                        }, 
                        Note, 
                        {
                            model: CoverCourse,
                            attributes: {
                                exclude: ['course_id', 'createdAt', 'updatedAt']
                            }
                        }, 
                        {
                            model: User,
                            attributes: {
                                exclude: ['status_id', 'password', 'createdAt', 'updatedAt']
                            }
                        }, 
                        {
                            model: CourseStatus,
                            attributes: {
                                exclude: ['createdAt', 'updatedAt']
                            }
                        }, 
                        {
                            model: LanguageCourse,
                            attributes: {
                                exclude: ['createdAt', 'updatedAt']
                            }
                        },
                    ],
                    where: { 
                        status_id: { [Op.ne]: status?.id },
                        instructor_id: req.userId
                    }
                });

                return res.status(200).json({ courses });
            }

            return res.status(401).json({ error: i18next.t('unauthorized') });

		} catch (err) {
			console.log(err);

			return res.status(500).json({ error: i18next.t('internal.error') });
		}
	}

     /**
   * allCourseEnrolled()
   *
   * Get all courses enrolled by one user in the database
   *
   * @param {Request} req: Request object
   * @param {Response} res: Response object
   * @param {NextFunction} next: NextFunction object
   *
   * @return Object
   */
     public static async allCoursesEnrolled(req: CustomRequest | any, res: Response): Promise<any> {
		try {
            const status: CourseStatus | null = await CourseStatus.findOne({
                where: { title: 'Archived' }
            });

            const enrollments: Array<Enrollment> = await Enrollment.findAll({
                where: { student_id: req.userId}
            });

            const coursesEnrolled: Array<Course> = [];

            for (const enrollment of enrollments) {
                const course: Course | null = await Course.findOne({
                    where: { 
                        id: enrollment.course_id,
                        status_id: { [Op.ne]: status?.id }
                    },
                    attributes: {
                        exclude: ['instructor_id', 'language_id','createdAt', 'updatedAt']
                    },
                    order: [['createdAt', 'DESC']],
                    include: [         
                        {
                            model: CoverCourse,
                            attributes: {
                                exclude: ['course_id', 'createdAt', 'updatedAt']
                            }
                        }, 
                        {
                            model: User,
                            attributes: {
                                exclude: ['status_id', 'password', 'createdAt', 'updatedAt']
                            }
                        }, 
                    ],
                });

                if (course) {
                    coursesEnrolled.push(course);
                }
            }
            
			return res.status(200).json({ coursesEnrolled });

		} catch (err) {
			console.log(err);

			return res.status(500).json({ error: i18next.t('internal.error') });
		}
	}
}

export { CourseController }