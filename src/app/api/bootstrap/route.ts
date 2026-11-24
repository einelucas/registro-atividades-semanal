import { NextRequest, NextResponse } from 'next/server';
import { activitySQL, identity, jsonError, pool } from '@/lib/server';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const user = await identity(req);
    const db = pool();
    const activityOrder = 'ORDER BY a.activity_date DESC, a.created_at DESC LIMIT 2500';
    const [people, units, categories, activities, ownActivities] = await Promise.all([
      db.query('SELECT id::text, display_name AS name, role FROM app_users WHERE active = true AND password_hash IS NOT NULL ORDER BY display_name'),
      db.query('SELECT id::text, name FROM units WHERE active = true ORDER BY name'),
      db.query('SELECT id::text, name FROM categories WHERE active = true ORDER BY name'),
      db.query(`${activitySQL} WHERE u.password_hash IS NOT NULL ${activityOrder}`),
      user.role === 'COLLABORATOR'
        ? db.query(`${activitySQL} WHERE a.user_id = $1 ${activityOrder}`, [user.userId])
        : null,
    ]);

    return NextResponse.json({
      people: people.rows,
      units: units.rows,
      categories: categories.rows,
      activities: activities.rows,
      ownActivities: ownActivities?.rows,
      demo: false,
      currentUserId: user.userId,
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return jsonError(error);
  }
}
