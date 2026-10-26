import {readFileSync} from 'node:fs';

// Preserve the application's established migration order in both database engines and test fixtures.
export const coreMigrations = [
 '001_core.sql', '005_operations.sql', '007_registration.sql',
 '009_registration_details.sql', '011_incident_updates.sql',
 '013_account_lifecycle.sql', '015_profile_photos.sql', '003_cpe.sql',
] as const;
export const supabaseMigrations = [
 '002_supabase.sql', '004_cpe_supabase.sql', '006_operations_supabase.sql',
 '008_registration_supabase.sql', '010_registration_details_supabase.sql',
 '012_incident_updates_supabase.sql', '014_account_lifecycle_supabase.sql',
 '016_profile_photos_supabase.sql',
] as const;
type Migration = typeof coreMigrations[number] | typeof supabaseMigrations[number];
export function readMigration(name: Migration): string {
 return readFileSync(new URL('../backend/migrations/' + name, import.meta.url), 'utf8');
}
