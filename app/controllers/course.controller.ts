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
import Review from '../models/course/review.model';
import CourseCategory from '../models/course/courseCategory.model';
import { col, fn, Op, Sequelize } from 'sequelize';
import Expertise from '../models/authentication/expertise.model';
import Enrollment from '../models/enrollment/enrollment.model';
import EnrollmentStatus from '../models/enrollment/enrollmentStatus.model';
import Institution from '../models/institution/institution.model';
import sequelize from 'sequelize';



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
            institution_id,
            visibility,
        } =  JSON.parse(req.body.data);

        // console.log("BODY", JSON.parse(req.body.data))

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
                visibility: institution_id ? (visibility || 'private') : 'public',
                ...(institution_id ? { institution_id } : {}),
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
                                duration: lessonData.duration || 0,
                                module_id: module.id,
                            }, { transaction });
    
                            // Associer la vidéo à la leçon
                            if (req.files && "videos" in req.files ) { //&& (req.files as any).videos[i]
                                const videoFile = (req.files as any).videos[i];
    
                                await VideoLesson.create({
                                    lesson_id: lesson.id,
                                    file_name: 'lessons_video/' + videoFile.filename,
                                    format: videoFile.mimetype
                                }, { transaction });
                            }
                        }
                    }
                }
            }

            if(categories && categories.length > 0){
                for(const category of categories){
                    // const cat = await Category.create({
                    //     title: category.title,
                    //     description: category.description,
                    // });
                    // admin_id: userRole.user_id,
                    const cat: Category | null = await Category.findOne({
                        where: { id: category }
                    });
                    
                    await CourseCategory.create({
                        course_id: course.id,
                        category_id: cat?.id,
                    }, { transaction });
                }
            }

            
            // if (cover_course) {
            //     await CoverCourse.create({
            //         ...cover_course,
            //         course_id: course.id,
            //     }, { transaction });
            // }
            if (req.files && "cover_image" in req.files) {
                const coverImageFile = (req.files as any).cover_image[0];
                await CoverCourse.create({
                    file_name: 'cover_course/' + coverImageFile.filename,
                    format: coverImageFile.mimetype,
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
            
            const publishedStatus: CourseStatus | null = await CourseStatus.findOne({
                where: { title: 'Published' }
            });
			const courses: Array<Course> = await Course.findAll({
                // attributes: {
                    
                // },
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
                    {
                        model: Review,
                        attributes: ['id', 'rating'],
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
                    {
                        model: Enrollment,
                        as: 'enrollments',
                        attributes: {
                            exclude: ['course_id', 'createdAt', 'updatedAt']
                        }
                    },
                    {
                        model: Institution,
                        attributes: ['id', 'name', 'slug', 'logo_url', 'brand_color']
                    }
                ],
                where: {
                    status_id: publishedStatus?.id,
                    visibility: 'public'
                },
                attributes: {
                    exclude: ['instructor_id', 'language_id','createdAt', 'updatedAt'],
                },
            });

			const coursesWithCounts = courses.map((course) => {
				const c = course.toJSON();
				c.enrolledStudents = c.enrollments?.length || 0;
				// Total duration: sum of all lessons' durations across all modules
				let totalDuration = 0;
				if (c.modules) {
					for (const mod of c.modules) {
						if (mod.lessons) {
							for (const lesson of mod.lessons) {
								totalDuration += lesson.duration || 0;
							}
						}
					}
				}
				c.duration = totalDuration;

				// Average rating from reviews
				if (c.reviews && c.reviews.length > 0) {
					const totalRating = c.reviews.reduce((sum: number, r: any) => sum + r.rating, 0);
					c.rating = Math.round((totalRating / c.reviews.length) * 10) / 10;
				} else {
					c.rating = null;
				}
				c.reviewsCount = c.reviews?.length || 0;
				return c;
			});

			return res.status(200).json({ courses: coursesWithCounts });
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
                    {
                        model: Review,
                        attributes: ['id', 'rating', 'comment'],
                        include: [
                            {
                                model: User,
                                attributes: ['id', 'name']
                            }
                        ]
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
                    },
                    {
                        model: Institution,
                        attributes: ['id', 'name', 'slug', 'logo_url', 'brand_color']
                    }
                ]
            });

			if (!course || course.status_id === status?.id) {
				return res.status(404).json({ message: i18next.t('model.not.found', { model: 'Course' }) });
			}

            const enrolledStudents = await Enrollment.count({
                where: { course_id: course.id }
            });

			// Calculate total course duration from lessons
			let totalDuration = 0;
			if (course.modules) {
				for (const mod of course.modules) {
					if (mod.lessons) {
						for (const lesson of mod.lessons) {
							totalDuration += lesson.duration || 0;
						}
					}
				}
			}

			const cJson = course.toJSON();
			cJson.duration = totalDuration;

			// Calculate average rating from reviews
			if (cJson.reviews && cJson.reviews.length > 0) {
				const totalRating = cJson.reviews.reduce((sum: number, r: any) => sum + r.rating, 0);
				cJson.rating = Math.round((totalRating / cJson.reviews.length) * 10) / 10;
			} else {
				cJson.rating = null;
			}
			cJson.reviewsCount = cJson.reviews?.length || 0;

			return res.status(200).json({ course: cJson, enrolledStudents });
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
                            model: Enrollment,
                            attributes: ['id', 'course_id'],
                            required: false
                        },
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


	/**
	 * adminAll()
	 *
	 * Get ALL courses (no filtering by status/visibility).
	 * For super admin dashboard.
	 *
	 * @param {Request} req: Request object
	 * @param {Response} res: Response object
	 *
	 * @return Object
	 */
	public static async adminAll(req: Request, res: Response): Promise<any> {
		try {
			const courses: Array<Course> = await Course.findAll({
				order: [['createdAt', 'DESC']],
				include: [
					{
						model: Module,
						attributes: ['id', 'title', 'resume'],
						include: [
							{
								model: Lesson,
								attributes: ['id', 'title', 'resume', 'duration'],
								include: [
									{
										model: VideoLesson,
										attributes: ['id', 'file_name', 'format']
									}
								]
							}
						]
					},
					{
						model: Category,
						through: { attributes: [] }
					},
					{
						model: Objective,
						attributes: ['id', 'title']
					},
					{
						model: Feature,
						attributes: ['id', 'title']
					},
					{
						model: Review,
						attributes: ['id', 'rating'],
					},
					{
						model: Note,
					},
					{
						model: CoverCourse,
						attributes: {
							exclude: ['course_id', 'createdAt', 'updatedAt']
						}
					},
					{
						model: User,
						as: 'instructor',
						attributes: {
							exclude: ['status_id', 'password', 'createdAt', 'updatedAt']
						}
					},
					{
						model: CourseStatus,
						attributes: ['id', 'title']
					},
					{
						model: LanguageCourse,
						attributes: {
							exclude: ['createdAt', 'updatedAt']
						}
					},
					{
						model: Enrollment,
						as: 'enrollments',
						attributes: {
							exclude: ['course_id', 'createdAt', 'updatedAt']
						}
					},
					{
						model: Institution,
						attributes: ['id', 'name', 'slug', 'logo_url', 'brand_color']
					}
				],
				attributes: {
					exclude: ['instructor_id', 'language_id', 'createdAt', 'updatedAt']
				}
			});

			const coursesWithCounts = courses.map((course: any) => {
				const c = course.toJSON();
				c.enrolledStudents = c.enrollments?.length || 0;
				let totalDuration = 0;
				if (c.modules) {
					for (const mod of c.modules) {
						if (mod.lessons) {
							for (const lesson of mod.lessons) {
								totalDuration += lesson.duration || 0;
							}
						}
					}
				}
				c.duration = totalDuration;
				if (c.reviews && c.reviews.length > 0) {
					const totalRating = c.reviews.reduce((sum: number, r: any) => sum + r.rating, 0);
					c.rating = Math.round((totalRating / c.reviews.length) * 10) / 10;
				} else {
					c.rating = null;
				}
				c.reviewsCount = c.reviews?.length || 0;
				return c;
			});

			return res.status(200).json({ courses: coursesWithCounts });
		} catch (err) {
			console.log(err);
			return res.status(500).json({ error: i18next.t('internal.error') });
		}
	}

	/**
	 * validateCourse()
	 *
	 * Approve or reject a course (change its status)
	 *
	 * @param {Request} req: Request object
	 * @param {Response} res: Response object
	 *
	 * @return Object
	 */
	public static async validateCourse(req: CustomRequest | any, res: Response): Promise<any> {
		const { action } = req.body;

		if (!action || !['approve', 'reject'].includes(action)) {
			return res.status(400).json({ message: 'L\'action doit être \"approve\" ou \"reject\"' });
		}

		try {
			const course = await Course.findByPk(req.params.id);
			if (!course) {
				return res.status(404).json({ message: i18next.t('model.not.found', { model: 'Course' }) });
			}

			let newStatusTitle: string;
			if (action === 'approve') {
				newStatusTitle = 'Published';
			} else {
				newStatusTitle = 'Draft';
			}

			const status = await CourseStatus.findOne({ where: { title: newStatusTitle } });
			if (!status) {
				return res.status(404).json({ message: 'Statut introuvable' });
			}

			await course.update({ status_id: status.id });

			return res.status(200).json({
				message: action === 'approve'
					? 'Cours publié avec succès'
					: 'Cours rejeté, retourné en brouillon',
				course
			});
		} catch (err) {
			console.log(err);
			return res.status(500).json({ error: i18next.t('internal.error') });
		}
	}

}

export { CourseController }