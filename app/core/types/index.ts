export enum RoleType {
    ADMIN = 'Admin',
    STUDENT = 'Student',
    INSTRUCTOR = 'Instructor'
}

export enum StatusUser {
    PENDING = 'Pending',
    ACTIVE = 'Active',
    REJECTED = 'Rejected',
    ARCHIVED = 'Archived'
}

export enum TypeDocument {
    PHOTOS = "Photos",
    DIPLOME = "Diplôme",
    AUTRES = "Autres"
}

export enum StatusCourse {
    DRAFT = 'Draft',
    SUBMIT = 'Submit',
    PUBLISHED = 'Published',
    ARCHIVED = 'Archived'
}

export enum StatusForum {
    OPEN = 'Open',
    CLOSED = 'Closed',
    REJECTED = 'Rejected',
    ARCHIVED = 'Archived'	
}

export enum StatusEnrollment {
    INIT = 'Init',
    ONGOING = 'Ongoing',
    COMPLETED = 'Completed',
    ARCHIVED = 'Archived'
}

export enum StatusPayment {
    PENDING = 'Pending',
    COMPLETED = 'Completed',
    REJECTED = 'Rejected',
    FAILED = 'Failed'
}

export enum MethodPayment {
    OM = 'Orange Money',
    MOMO = 'Mtn Mobile Money',
    VISA = 'Visa',
    MASTERCARD = 'Master Card',
    PAYPAL = 'PayPal'
}

export interface CustomRequest extends Request {
    adminId: number;
}