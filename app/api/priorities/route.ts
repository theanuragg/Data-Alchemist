import { NextRequest, NextResponse } from 'next/server';

interface Priority {
  id: string;
  name: string;
  weight: number;
  description: string;
}

let priorities: Priority[] = [
  { id: 'priority_level', name: 'Priority Level', weight: 0.3, description: 'Client priority importance' },
  { id: 'task_fulfillment', name: 'Task Fulfillment', weight: 0.25, description: 'Requested tasks completion' },
  { id: 'workload_balance', name: 'Workload Balance', weight: 0.2, description: 'Fair distribution among workers' },
  { id: 'skill_match', name: 'Skill Matching', weight: 0.15, description: 'Best skill-task alignment' },
  { id: 'phase_preference', name: 'Phase Preference', weight: 0.1, description: 'Preferred phase scheduling' }
];

// --- GET method ---
export async function GET(req: NextRequest) {
  return NextResponse.json({ priorities }, { status: 200 });
}

// --- POST method ---
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, ...payload } = body;

    if (action === 'updateWeights') {
      const { weights } = payload;
      priorities = priorities.map(p => ({
        ...p,
        weight: weights[p.id] || p.weight,
      }));
      return NextResponse.json({ success: true, priorities }, { status: 200 });

    } else if (action === 'setPreset') {
      const presets = {
        maximize_fulfillment: {
          priority_level: 0.4,
          task_fulfillment: 0.35,
          workload_balance: 0.1,
          skill_match: 0.1,
          phase_preference: 0.05
        },
        fair_distribution: {
          priority_level: 0.2,
          task_fulfillment: 0.2,
          workload_balance: 0.4,
          skill_match: 0.15,
          phase_preference: 0.05
        },
        minimize_workload: {
          priority_level: 0.15,
          task_fulfillment: 0.15,
          workload_balance: 0.5,
          skill_match: 0.15,
          phase_preference: 0.05
        },
        skill_focused: {
          priority_level: 0.2,
          task_fulfillment: 0.2,
          workload_balance: 0.15,
          skill_match: 0.4,
          phase_preference: 0.05
        }
      } as const;

      type PresetKey = keyof typeof presets;
      const { preset } = payload as { preset: PresetKey };

      if (!presets[preset]) {
        return NextResponse.json({ error: 'Invalid preset' }, { status: 400 });
      }

      priorities = priorities.map(p => ({
        ...p,
        weight: presets[preset][p.id as keyof typeof presets[PresetKey]] ?? p.weight
      }));

      return NextResponse.json({ success: true, priorities, preset }, { status: 200 });

    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Priorities API error:', error);
    return NextResponse.json({ error: 'Priorities operation failed' }, { status: 500 });
  }
}
