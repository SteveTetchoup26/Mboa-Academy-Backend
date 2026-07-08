import InstitutionType from '../models/institution/institutionType.model';
import InstitutionStatus from '../models/institution/institutionStatus.model';

export async function seedInstitutionTypes() {
    try {
        const types = ['University', 'School', 'Training Center', 'Other'];

        for (const title of types) {
            await InstitutionType.findOrCreate({ where: { title } });
        }

        console.log('✅ Institution types seeded successfully');
    } catch (error) {
        console.error('❌ Error seeding institution types:', error);
    }
}

export async function seedInstitutionStatuses() {
    try {
        const statuses = ['Pending', 'Active', 'Rejected', 'Suspended', 'Archived'];

        for (const title of statuses) {
            await InstitutionStatus.findOrCreate({ where: { title } });
        }

        console.log('✅ Institution statuses seeded successfully');
    } catch (error) {
        console.error('❌ Error seeding institution statuses:', error);
    }
}
